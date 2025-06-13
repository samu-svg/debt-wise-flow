
import { useState, useEffect, useCallback } from 'react';

interface BackupHook {
  isSupported: boolean;
  isConfigured: boolean;
  isConnected: boolean;
  folderName: string;
  configureFolder: () => Promise<boolean>;
  createBackup: (data: any) => Promise<boolean>;
  showConfigModal: boolean;
  setShowConfigModal: (show: boolean) => void;
}

const DB_NAME = 'debt_manager_backup';
const DB_VERSION = 1;
const STORE_NAME = 'folder_handles';

export const useFileSystemBackup = (): BackupHook => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);

  // Verificar se a API é suportada
  const isSupported = 'showDirectoryPicker' in window;

  // IndexedDB helpers
  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }, []);

  const saveFolderHandle = useCallback(async (handle: FileSystemDirectoryHandle) => {
    if (!isSupported) return;
    
    try {
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise<void>((resolve, reject) => {
        const request = store.put(handle, 'backup_folder');
        request.onsuccess = () => {
          setFolderHandle(handle);
          setFolderName(handle.name);
          setIsConfigured(true);
          setIsConnected(true);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Erro ao salvar pasta:', error);
    }
  }, [isSupported, openDB]);

  const loadFolderHandle = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
        const request = store.get('backup_folder');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      
      if (handle) {
        try {
          // Verificar se ainda temos permissão tentando acessar o handle
          await handle.getFileHandle('test_permission.tmp', { create: true });
          // Se chegou aqui, temos permissão
          setFolderHandle(handle);
          setFolderName(handle.name);
          setIsConfigured(true);
          setIsConnected(true);
        } catch (permissionError) {
          // Sem permissão - configurado mas desconectado
          setFolderName(handle.name);
          setIsConfigured(true);
          setIsConnected(false);
        }
      } else {
        // Mostrar modal se não configurado
        setShowConfigModal(true);
      }
    } catch (error) {
      console.error('Erro ao carregar pasta:', error);
      setShowConfigModal(true);
    }
  }, [isSupported, openDB]);

  const configureFolder = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      
      await saveFolderHandle(handle);
      setShowConfigModal(false);
      return true;
    } catch (error) {
      console.error('Erro ao configurar pasta:', error);
      return false;
    }
  }, [isSupported, saveFolderHandle]);

  const createBackup = useCallback(async (data: any): Promise<boolean> => {
    if (!folderHandle || !isConnected) return false;
    
    try {
      // Criar backup principal
      const mainFileName = 'devedores.json';
      const mainFileHandle = await folderHandle.getFileHandle(mainFileName, { create: true });
      const mainWritable = await mainFileHandle.createWritable();
      
      const backupData = {
        ...data,
        lastBackup: new Date().toISOString(),
        version: '2.0'
      };
      
      await mainWritable.write(JSON.stringify(backupData, null, 2));
      await mainWritable.close();

      // Criar backup com data
      const now = new Date();
      const dateString = now.toISOString().split('T')[0];
      const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const backupFileName = `backup_${dateString}_${timeString}.json`;
      
      const backupFileHandle = await folderHandle.getFileHandle(backupFileName, { create: true });
      const backupWritable = await backupFileHandle.createWritable();
      await backupWritable.write(JSON.stringify(backupData, null, 2));
      await backupWritable.close();

      return true;
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      setIsConnected(false);
      return false;
    }
  }, [folderHandle, isConnected]);

  // Carregar configuração na inicialização
  useEffect(() => {
    if (isSupported) {
      loadFolderHandle();
    }
  }, [isSupported, loadFolderHandle]);

  return {
    isSupported,
    isConfigured,
    isConnected,
    folderName,
    configureFolder,
    createBackup,
    showConfigModal,
    setShowConfigModal
  };
};
