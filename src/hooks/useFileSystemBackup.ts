
import { useState, useEffect } from 'react';

// Extend Window interface for File System Access API
declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite';
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

// Função para abrir IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DebtManagerDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('directoryHandles')) {
        db.createObjectStore('directoryHandles');
      }
    };
  });
};

// Função para salvar handle da pasta
const saveDirectoryHandle = async (handle: FileSystemDirectoryHandle): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['directoryHandles'], 'readwrite');
    const store = transaction.objectStore('directoryHandles');
    await store.put(handle, 'backupDirectory');
  } catch (error) {
    console.error('Erro ao salvar handle:', error);
    throw error;
  }
};

// Função para recuperar handle da pasta
const getDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['directoryHandles'], 'readonly');
    const store = transaction.objectStore('directoryHandles');
    
    return new Promise((resolve, reject) => {
      const request = store.get('backupDirectory');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (error) {
    console.error('Erro ao recuperar handle:', error);
    return null;
  }
};

export const useFileSystemBackup = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstAccess, setIsFirstAccess] = useState(false);

  // Check if running in iframe (development mode)
  const isInIframe = window.self !== window.top;

  useEffect(() => {
    const checkSupport = () => {
      const supported = 'showDirectoryPicker' in window && !isInIframe;
      setIsSupported(supported);
      
      if (!supported && !isInIframe) {
        console.warn('File System Access API não suportado neste navegador');
        setLoading(false);
        return;
      }
    };

    const checkConfiguration = async () => {
      try {
        const hasConfigured = localStorage.getItem('pastaConfigurada') === 'true';
        
        if (!hasConfigured) {
          setIsFirstAccess(true);
          setIsConfigured(false);
          setLoading(false);
          return;
        }

        const handle = await getDirectoryHandle();
        if (handle) {
          try {
            // Test if we still have permission
            await handle.getDirectoryHandle('test', { create: false }).catch(() => {});
            setDirectoryHandle(handle);
            setIsConfigured(true);
            setIsFirstAccess(false);
          } catch (error) {
            console.log('Permissão de pasta perdida, precisa reconfigurar');
            localStorage.removeItem('pastaConfigurada');
            setIsConfigured(false);
            setIsFirstAccess(true);
          }
        } else {
          setIsConfigured(false);
          setIsFirstAccess(true);
          localStorage.removeItem('pastaConfigurada');
        }
      } catch (error) {
        console.error('Erro ao verificar configuração:', error);
        setIsConfigured(false);
        setIsFirstAccess(true);
      } finally {
        setLoading(false);
      }
    };

    checkSupport();
    if (isSupported || isInIframe) {
      checkConfiguration();
    }
  }, [isSupported, isInIframe]);

  const configureDirectory = async (): Promise<boolean> => {
    if (!isSupported) {
      throw new Error('File System Access API não suportado');
    }

    try {
      const handle = await window.showDirectoryPicker!({
        mode: 'readwrite'
      });

      await saveDirectoryHandle(handle);
      setDirectoryHandle(handle);
      setIsConfigured(true);
      setIsFirstAccess(false);
      localStorage.setItem('pastaConfigurada', 'true');
      
      console.log('Pasta configurada com sucesso:', handle.name);
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Usuário cancelou a seleção de pasta');
      } else {
        console.error('Erro ao configurar pasta:', error);
      }
      throw error;
    }
  };

  const saveBackup = async (data: string, filename: string): Promise<boolean> => {
    if (!directoryHandle || !isConfigured) {
      throw new Error('Pasta não configurada');
    }

    try {
      const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
      
      console.log(`Backup salvo: ${filename}`);
      return true;
    } catch (error) {
      console.error('Erro ao salvar backup:', error);
      throw error;
    }
  };

  const getBackupStatus = () => {
    if (!isSupported && !isInIframe) {
      return 'Navegador não suportado';
    }
    
    if (loading) {
      return 'Verificando...';
    }
    
    if (isConfigured && directoryHandle) {
      return `Pasta: ${directoryHandle.name}`;
    }
    
    return 'Não configurado';
  };

  const forceConfiguration = () => {
    setIsFirstAccess(true);
    setIsConfigured(false);
    localStorage.removeItem('pastaConfigurada');
  };

  return {
    isSupported,
    isConfigured,
    isConnected: isConfigured && directoryHandle !== null,
    loading,
    directoryHandle,
    folderName: directoryHandle?.name || '',
    isInIframe,
    isFirstAccess,
    configureDirectory,
    configureFolder: configureDirectory,
    saveBackup,
    getBackupStatus,
    forceConfiguration,
    setShowConfigModal: () => {} // Placeholder function
  };
};
