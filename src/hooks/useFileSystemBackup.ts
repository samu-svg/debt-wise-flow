import { useState, useEffect } from 'react';
import { useFileSystemManager } from './useFileSystemManager';

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
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstAccess, setIsFirstAccess] = useState(false);

  const {
    capabilities,
    isInitialized,
    lastError,
    handleDirectoryAccess,
    saveFile,
    getErrorSuggestions,
    clearError,
    getSystemStatus
  } = useFileSystemManager();

  // Check if running in iframe (development mode)
  const isInIframe = window.self !== window.top;

  useEffect(() => {
    const checkConfiguration = async () => {
      if (!isInitialized) return;

      try {
        const hasConfigured = localStorage.getItem('pastaConfigurada') === 'true';
        
        if (!hasConfigured) {
          setIsFirstAccess(true);
          setIsConfigured(false);
          setLoading(false);
          return;
        }

        // Apenas tentar recuperar handle se File System API estiver disponível
        if (capabilities?.fileSystemAccess) {
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
        } else {
          // Para fallback, marcar como configurado se já foi aceito antes
          setIsConfigured(hasConfigured);
          setIsFirstAccess(false);
        }
      } catch (error) {
        console.error('Erro ao verificar configuração:', error);
        setIsConfigured(false);
        setIsFirstAccess(true);
      } finally {
        setLoading(false);
      }
    };

    checkConfiguration();
  }, [isInitialized, capabilities]);

  const configureDirectory = async (): Promise<boolean> => {
    try {
      clearError();

      // Se File System API não estiver disponível, apenas marcar como configurado
      if (!capabilities?.fileSystemAccess) {
        setIsConfigured(true);
        setIsFirstAccess(false);
        localStorage.setItem('pastaConfigurada', 'true');
        return true;
      }

      // Usar File System API
      const handle = await handleDirectoryAccess();
      
      if (handle) {
        await saveDirectoryHandle(handle);
        setDirectoryHandle(handle);
        setIsConfigured(true);
        setIsFirstAccess(false);
        localStorage.setItem('pastaConfigurada', 'true');
        
        console.log('Pasta configurada com sucesso:', handle.name);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao configurar pasta:', error);
      throw error;
    }
  };

  const saveBackup = async (data: string, filename: string): Promise<boolean> => {
    try {
      clearError();
      return await saveFile(data, filename, directoryHandle);
    } catch (error) {
      console.error('Erro ao salvar backup:', error);
      throw error;
    }
  };

  const getBackupStatus = () => {
    if (loading) return 'Verificando...';
    if (lastError) return `Erro: ${lastError.message}`;
    
    return getSystemStatus();
  };

  const forceConfiguration = () => {
    setIsFirstAccess(true);
    setIsConfigured(false);
    localStorage.removeItem('pastaConfigurada');
    clearError();
  };

  return {
    isSupported: capabilities?.fileSystemAccess || !isInIframe,
    isConfigured,
    isConnected: isConfigured && (directoryHandle !== null || !capabilities?.fileSystemAccess),
    loading,
    directoryHandle,
    folderName: directoryHandle?.name || (isConfigured && !capabilities?.fileSystemAccess ? 'Download' : ''),
    isInIframe,
    isFirstAccess,
    lastError,
    errorSuggestions: lastError ? getErrorSuggestions(lastError) : [],
    configureDirectory,
    configureFolder: configureDirectory,
    saveBackup,
    getBackupStatus,
    forceConfiguration,
    clearError,
    setShowConfigModal: () => {}
  };
};
