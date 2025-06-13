
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
    await store.put(handle, 'dataDirectory');
    console.log('Handle da pasta salvo com sucesso');
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
      const request = store.get('dataDirectory');
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
  const [isFirstAccess, setIsFirstAccess] = useState(true);

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

  useEffect(() => {
    const checkConfiguration = async () => {
      if (!isInitialized) return;

      try {
        console.log('Verificando configuração da pasta de dados...');
        const hasConfigured = localStorage.getItem('pastaConfigurada') === 'true';
        
        // Se estamos em iframe, usar sempre modo download
        if (capabilities?.isInFrame) {
          console.log('Modo iframe detectado - usando download automático');
          setIsConfigured(true);
          setIsFirstAccess(false);
          setLoading(false);
          localStorage.setItem('pastaConfigurada', 'true');
          return;
        }
        
        if (!hasConfigured) {
          console.log('Primeira configuração necessária');
          setIsFirstAccess(true);
          setIsConfigured(false);
          setLoading(false);
          return;
        }

        // Tentar recuperar handle se File System API estiver disponível
        if (capabilities?.fileSystemAccess) {
          const handle = await getDirectoryHandle();
          if (handle) {
            try {
              // Testar se ainda temos acesso fazendo uma operação simples
              const testFile = await handle.getFileHandle('test-access.tmp', { create: true });
              await handle.removeEntry('test-access.tmp').catch(() => {});
              
              setDirectoryHandle(handle);
              setIsConfigured(true);
              setIsFirstAccess(false);
              console.log('Pasta configurada e acessível:', handle.name);
            } catch (error) {
              console.log('Erro ao verificar acesso à pasta:', error);
              localStorage.removeItem('pastaConfigurada');
              setIsConfigured(false);
              setIsFirstAccess(true);
            }
          } else {
            console.log('Handle não encontrado, reconfiguração necessária');
            setIsConfigured(false);
            setIsFirstAccess(true);
            localStorage.removeItem('pastaConfigurada');
          }
        } else {
          // Para fallback, marcar como configurado se já foi aceito antes
          setIsConfigured(hasConfigured);
          setIsFirstAccess(false);
          console.log('Modo fallback ativo');
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
      console.log('Iniciando configuração da pasta...');
      clearError();

      // Se estamos em iframe ou File System API não disponível, usar fallback
      if (capabilities?.isInFrame || !capabilities?.fileSystemAccess) {
        console.log('Usando modo download por limitação do ambiente');
        setIsConfigured(true);
        setIsFirstAccess(false);
        localStorage.setItem('pastaConfigurada', 'true');
        return true;
      }

      // Usar File System API
      console.log('Solicitando seleção de pasta...');
      const handle = await handleDirectoryAccess();
      
      if (handle) {
        console.log('Pasta selecionada:', handle.name);
        
        // Salvar handle
        await saveDirectoryHandle(handle);
        setDirectoryHandle(handle);
        setIsConfigured(true);
        setIsFirstAccess(false);
        localStorage.setItem('pastaConfigurada', 'true');
        
        console.log('Configuração concluída com sucesso');
        return true;
      }

      console.log('Nenhuma pasta foi selecionada');
      return false;
    } catch (error) {
      console.error('Erro ao configurar pasta:', error);
      
      // Se foi cancelado pelo usuário, não mostrar como erro
      if ((error as Error).name === 'AbortError') {
        console.log('Seleção cancelada pelo usuário');
        return false;
      }
      
      // Se é erro de segurança (iframe), usar fallback
      if ((error as Error).name === 'SecurityError') {
        console.log('Erro de segurança detectado, usando modo download');
        setIsConfigured(true);
        setIsFirstAccess(false);
        localStorage.setItem('pastaConfigurada', 'true');
        return true;
      }
      
      throw error;
    }
  };

  const saveData = async (data: string, filename: string): Promise<boolean> => {
    try {
      clearError();
      console.log('Salvando dados:', filename);
      return await saveFile(data, filename, directoryHandle);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      throw error;
    }
  };

  const getStatus = () => {
    if (loading) return 'Verificando configuração...';
    if (lastError) return `Erro: ${lastError.message}`;
    if (!isConfigured) return 'Pasta não configurada';
    if (isConfigured && directoryHandle) return `Pasta: ${directoryHandle.name}`;
    if (isConfigured) return 'Modo download ativo';
    
    return getSystemStatus();
  };

  const forceConfiguration = () => {
    console.log('Forçando nova configuração');
    setIsFirstAccess(true);
    setIsConfigured(false);
    localStorage.removeItem('pastaConfigurada');
    clearError();
  };

  return {
    isSupported: capabilities?.fileSystemAccess || true,
    isConfigured,
    isConnected: isConfigured && (directoryHandle !== null || !capabilities?.fileSystemAccess),
    loading,
    directoryHandle,
    folderName: directoryHandle?.name || (isConfigured && !capabilities?.fileSystemAccess ? 'Download' : ''),
    isFirstAccess,
    lastError,
    errorSuggestions: lastError ? getErrorSuggestions(lastError) : [],
    configureDirectory,
    configureFolder: configureDirectory,
    saveBackup: saveData,
    saveData,
    getBackupStatus: getStatus,
    getStatus,
    forceConfiguration,
    clearError,
    setShowConfigModal: () => {}
  };
};
