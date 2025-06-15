
import { useState, useEffect } from 'react';
import { useFileSystemManager } from './useFileSystemManager';
import { useUserFolderConfig } from './useUserFolderConfig';
import { useAuth } from './useAuth';

// Função para abrir IndexedDB com melhor estrutura
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DebtManagerDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Criar store para handles de diretório se não existir
      if (!db.objectStoreNames.contains('directoryHandles')) {
        const handleStore = db.createObjectStore('directoryHandles');
        handleStore.createIndex('userId', 'userId', { unique: false });
      }
      
      // Criar store para metadados de pasta
      if (!db.objectStoreNames.contains('folderMetadata')) {
        const metaStore = db.createObjectStore('folderMetadata');
        metaStore.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
};

// Função para salvar handle da pasta com metadados do usuário
const saveDirectoryHandle = async (handle: FileSystemDirectoryHandle, userId: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['directoryHandles', 'folderMetadata'], 'readwrite');
    
    // Salvar handle
    const handleStore = transaction.objectStore('directoryHandles');
    await handleStore.put({ handle, userId }, `user_${userId}`);
    
    // Salvar metadados
    const metaStore = transaction.objectStore('folderMetadata');
    await metaStore.put({
      userId,
      folderName: handle.name,
      lastAccessed: new Date().toISOString(),
      isValid: true
    }, `meta_${userId}`);
    
    console.log('✅ Handle da pasta salvo com metadados para usuário:', userId);
  } catch (error) {
    console.error('❌ Erro ao salvar handle:', error);
    throw error;
  }
};

// Função para recuperar handle da pasta do usuário específico
const getDirectoryHandle = async (userId: string): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['directoryHandles'], 'readonly');
    const store = transaction.objectStore('directoryHandles');
    
    return new Promise((resolve, reject) => {
      const request = store.get(`user_${userId}`);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.handle : null);
      };
    });
  } catch (error) {
    console.error('❌ Erro ao recuperar handle:', error);
    return null;
  }
};

// Função para validar se ainda temos acesso à pasta
const validateDirectoryAccess = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
  try {
    // Tentar listar o conteúdo da pasta
    const iterator = handle.entries();
    await iterator.next();
    
    // Tentar criar um arquivo de teste
    const testFile = await handle.getFileHandle('_debt_manager_test.tmp', { create: true });
    const writable = await testFile.createWritable();
    await writable.write('test');
    await writable.close();
    
    // Remover arquivo de teste
    await handle.removeEntry('_debt_manager_test.tmp');
    
    return true;
  } catch (error) {
    console.log('❌ Pasta não acessível:', error);
    return false;
  }
};

// Função para invalidar handle no IndexedDB
const invalidateDirectoryHandle = async (userId: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['folderMetadata'], 'readwrite');
    const store = transaction.objectStore('folderMetadata');
    
    const request = store.get(`meta_${userId}`);
    request.onsuccess = () => {
      const metadata = request.result;
      if (metadata) {
        metadata.isValid = false;
        metadata.lastError = new Date().toISOString();
        store.put(metadata, `meta_${userId}`);
      }
    };
  } catch (error) {
    console.error('Erro ao invalidar handle:', error);
  }
};

export const useFileSystemBackup = () => {
  const { user } = useAuth();
  const { folderConfig, saveFolderConfig, isConfigured } = useUserFolderConfig();
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

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

  // Função para reconexão automática
  const attemptAutoReconnect = async (userId: string): Promise<boolean> => {
    if (!capabilities?.fileSystemAccess) {
      console.log('📱 File System API não disponível - usando modo fallback');
      return false;
    }

    setReconnecting(true);
    console.log('🔄 Tentando reconexão automática para usuário:', userId);

    try {
      // Recuperar handle salvo
      const savedHandle = await getDirectoryHandle(userId);
      
      if (!savedHandle) {
        console.log('📁 Nenhum handle salvo encontrado');
        return false;
      }

      console.log('📁 Handle recuperado, validando acesso...');
      
      // Validar se ainda temos acesso
      const isValid = await validateDirectoryAccess(savedHandle);
      
      if (isValid) {
        setDirectoryHandle(savedHandle);
        console.log('✅ Reconexão automática bem-sucedida:', savedHandle.name);
        return true;
      } else {
        console.log('❌ Handle não é mais válido');
        await invalidateDirectoryHandle(userId);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na reconexão automática:', error);
      if (userId) {
        await invalidateDirectoryHandle(userId);
      }
      return false;
    } finally {
      setReconnecting(false);
    }
  };

  useEffect(() => {
    const initializeFileSystem = async () => {
      if (!isInitialized || !user) {
        setLoading(false);
        return;
      }

      try {
        console.log('🚀 Inicializando sistema de arquivos para:', user.email);
        clearError();

        // Se usuário tem pasta configurada, tentar reconexão automática
        if (isConfigured && capabilities?.fileSystemAccess) {
          console.log('⚙️ Pasta configurada detectada, iniciando reconexão automática...');
          
          const reconnected = await attemptAutoReconnect(user.id);
          
          if (!reconnected) {
            console.log('⚠️ Reconexão automática falhou - usuário precisará reconfigurar');
            // Não setamos erro aqui, apenas informamos que reconexão falhou
          }
        } else if (!capabilities?.fileSystemAccess) {
          console.log('📱 Modo compatibilidade ativo (File System API não disponível)');
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar sistema de arquivos:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeFileSystem();
  }, [isInitialized, user, isConfigured, capabilities]);

  const configureDirectory = async (): Promise<boolean> => {
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return false;
    }

    try {
      console.log('🔧 Configurando pasta para usuário:', user.id);
      clearError();

      // Verificar se File System API está disponível
      if (!capabilities?.fileSystemAccess) {
        console.error('❌ File System API não disponível');
        return false;
      }

      // Usar File System API
      console.log('📁 Solicitando seleção de pasta...');
      const handle = await handleDirectoryAccess();
      
      if (handle) {
        console.log('✅ Pasta selecionada:', handle.name);
        
        // Salvar handle no IndexedDB com ID do usuário
        await saveDirectoryHandle(handle, user.id);
        setDirectoryHandle(handle);

        // Salvar configuração no banco de dados
        await saveFolderConfig(handle.name, {
          type: 'file_system_access',
          name: handle.name,
          userId: user.id
        });
        
        console.log('✅ Configuração concluída para usuário:', user.id);
        return true;
      }

      console.log('❌ Nenhuma pasta foi selecionada');
      return false;
    } catch (error) {
      console.error('❌ Erro ao configurar pasta:', error);
      
      // Se foi cancelado pelo usuário, não mostrar como erro
      if ((error as Error).name === 'AbortError') {
        console.log('Seleção cancelada pelo usuário');
        return false;
      }
      
      throw error;
    }
  };

  // FUNÇÃO PRINCIPAL: Salvar dados na pasta principal
  const saveData = async (data: string, filename: string): Promise<boolean> => {
    try {
      clearError();
      console.log('💾 Salvando dados:', filename);
      
      // Verificar se temos acesso à pasta
      if (!directoryHandle || !capabilities?.fileSystemAccess) {
        console.log('📱 Pasta não disponível - usando fallback');
        return false;
      }
      
      // Salvar na pasta principal
      const success = await saveFile(data, filename, directoryHandle);
      if (success) {
        console.log('✅ Dados salvos na pasta principal');
        return true;
      }
      
      console.error('❌ Falha ao salvar na pasta principal');
      return false;
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      return false;
    }
  };

  // Função para restaurar dados da pasta
  const restoreFromFolder = async (): Promise<any> => {
    if (!directoryHandle || !capabilities?.fileSystemAccess) {
      throw new Error('Pasta não disponível para restauração');
    }

    try {
      console.log('🔄 Procurando dados na pasta...');
      const dataFiles: string[] = [];
      
      for await (const [name] of directoryHandle.entries()) {
        if (name.includes('debt_manager_data') && name.endsWith('.json')) {
          dataFiles.push(name);
        }
      }
      
      if (dataFiles.length === 0) {
        throw new Error('Nenhum arquivo de dados encontrado na pasta');
      }
      
      // Pegar o arquivo mais recente
      const latestData = dataFiles.sort().reverse()[0];
      console.log('📁 Restaurando do arquivo:', latestData);
      
      const fileHandle = await directoryHandle.getFileHandle(latestData);
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      console.log('✅ Dados restaurados da pasta');
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ Erro ao restaurar da pasta:', error);
      throw error;
    }
  };

  const getStatus = () => {
    if (loading) return 'Inicializando sistema...';
    if (reconnecting) return 'Reconectando à pasta...';
    if (lastError) return `Erro: ${lastError.message}`;
    if (!isConfigured) return 'Pasta não configurada';
    if (isConfigured && directoryHandle) return `✅ Conectado: ${directoryHandle.name}`;
    if (isConfigured && folderConfig) return `⚠️ Pasta configurada mas desconectada: ${folderConfig.folder_name}`;
    
    return getSystemStatus();
  };

  const isConnected = isConfigured && directoryHandle !== null && capabilities?.fileSystemAccess && !reconnecting;

  return {
    isSupported: capabilities?.fileSystemAccess || false,
    isConfigured,
    isConnected,
    loading,
    reconnecting,
    directoryHandle,
    folderName: directoryHandle?.name || folderConfig?.folder_name || '',
    isFirstAccess: !isConfigured,
    lastError,
    errorSuggestions: lastError ? getErrorSuggestions(lastError) : [],
    configureDirectory,
    saveData,
    restoreFromFolder,
    getStatus,
    clearError,
    attemptAutoReconnect: () => user ? attemptAutoReconnect(user.id) : Promise.resolve(false)
  };
};
