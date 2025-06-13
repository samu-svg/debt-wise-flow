import { useState, useEffect } from 'react';
import { useFileSystemManager } from './useFileSystemManager';
import { useUserFolderConfig } from './useUserFolderConfig';
import { useAuth } from './useAuth';

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
  const { user } = useAuth();
  const { folderConfig, saveFolderConfig, isConfigured } = useUserFolderConfig();
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [loading, setLoading] = useState(true);

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
    const initializeFileSystem = async () => {
      if (!isInitialized || !user) return;

      try {
        console.log('Inicializando sistema principal de arquivos para:', user.email);

        // Se estamos em iframe, usar sempre modo download
        if (capabilities?.isInFrame) {
          console.log('Modo iframe detectado - usando download automático');
          setLoading(false);
          return;
        }

        // Se usuário tem pasta configurada, tentar recuperar handle
        if (isConfigured && capabilities?.fileSystemAccess) {
          console.log('Usuário tem pasta configurada, tentando recuperar acesso...');
          const handle = await getDirectoryHandle();
          
          if (handle) {
            try {
              // Testar se ainda temos acesso tentando listar conteúdo
              let hasAccess = false;
              for await (const [name] of handle.entries()) {
                hasAccess = true;
                break; // Se conseguiu listar pelo menos uma entrada, tem acesso
              }
              
              setDirectoryHandle(handle);
              console.log('✅ Acesso à pasta principal recuperado:', handle.name);
            } catch (error) {
              console.log('❌ Erro ao verificar acesso à pasta:', error);
              // Pasta não acessível mais, usuário precisará reconfigurar
            }
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar sistema de arquivos:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeFileSystem();
  }, [isInitialized, user, isConfigured, capabilities]);

  const configureDirectory = async (): Promise<boolean> => {
    try {
      console.log('🔧 Configurando pasta principal...');
      clearError();

      // Se estamos em iframe ou File System API não disponível, usar fallback
      if (capabilities?.isInFrame || !capabilities?.fileSystemAccess) {
        console.log('📥 Usando modo download automático por limitação do ambiente');
        return true;
      }

      // Usar File System API
      console.log('📁 Solicitando seleção de pasta principal...');
      const handle = await handleDirectoryAccess();
      
      if (handle) {
        console.log('✅ Pasta principal selecionada:', handle.name);
        
        // Salvar handle no IndexedDB
        await saveDirectoryHandle(handle);
        setDirectoryHandle(handle);

        // Salvar configuração no banco de dados
        await saveFolderConfig(handle.name, {
          type: 'file_system_access',
          name: handle.name
        });
        
        console.log('✅ Configuração da pasta principal concluída');
        return true;
      }

      console.log('❌ Nenhuma pasta foi selecionada');
      return false;
    } catch (error) {
      console.error('Erro ao configurar pasta principal:', error);
      
      // Se foi cancelado pelo usuário, não mostrar como erro
      if ((error as Error).name === 'AbortError') {
        console.log('Seleção cancelada pelo usuário');
        return false;
      }
      
      // Se é erro de segurança (iframe), usar fallback
      if ((error as Error).name === 'SecurityError') {
        console.log('Erro de segurança detectado, usando modo download');
        return true;
      }
      
      throw error;
    }
  };

  // FUNÇÃO PRINCIPAL: Salvar dados (pasta principal ou download automático)
  const saveData = async (data: string, filename: string): Promise<boolean> => {
    try {
      clearError();
      console.log('💾 Salvando dados principais:', filename);
      
      // PRIORIDADE 1: Tentar salvar na pasta principal
      if (directoryHandle && capabilities?.fileSystemAccess) {
        const success = await saveFile(data, filename, directoryHandle);
        if (success) {
          console.log('✅ Dados salvos na pasta principal');
          return true;
        }
      }
      
      // PRIORIDADE 2: Download automático se pasta não disponível
      console.log('📥 Pasta não disponível - iniciando download automático');
      return await downloadBackup(data, filename);
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      // Tentar download como fallback
      try {
        console.log('🔄 Tentando download como fallback...');
        return await downloadBackup(data, filename);
      } catch (downloadError) {
        console.error('❌ Erro também no download fallback:', downloadError);
        return false;
      }
    }
  };

  // FUNÇÃO: Download automático/manual
  const downloadBackup = async (data: string, filename: string): Promise<boolean> => {
    try {
      console.log('📥 Executando download:', filename);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Download concluído automaticamente');
      return true;
    } catch (error) {
      console.error('❌ Erro no download:', error);
      return false;
    }
  };

  // Função para restaurar dados da pasta
  const restoreFromFolder = async (): Promise<any> => {
    if (!directoryHandle || !capabilities?.fileSystemAccess) {
      throw new Error('Pasta principal não disponível para restauração');
    }

    try {
      console.log('🔄 Procurando dados na pasta principal...');
      const dataFiles: string[] = [];
      
      for await (const [name] of directoryHandle.entries()) {
        if (name.includes('debt_manager_data') && name.endsWith('.json')) {
          dataFiles.push(name);
        }
      }
      
      if (dataFiles.length === 0) {
        throw new Error('Nenhum arquivo de dados encontrado na pasta principal');
      }
      
      // Pegar o arquivo mais recente
      const latestData = dataFiles.sort().reverse()[0];
      console.log('📁 Restaurando do arquivo:', latestData);
      
      const fileHandle = await directoryHandle.getFileHandle(latestData);
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      console.log('✅ Dados restaurados da pasta principal');
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ Erro ao restaurar da pasta principal:', error);
      throw error;
    }
  };

  const getStatus = () => {
    if (loading) return 'Verificando configuração...';
    if (lastError) return `Erro: ${lastError.message}`;
    if (!isConfigured) return 'Pasta principal não configurada';
    if (isConfigured && directoryHandle) return `✅ Pasta Principal: ${directoryHandle.name}`;
    if (isConfigured && folderConfig) return `📁 Pasta: ${folderConfig.folder_name}`;
    if (capabilities?.isInFrame) return '📥 Modo download automático ativo';
    
    return getSystemStatus();
  };

  const isConnected = isConfigured && (directoryHandle !== null || !capabilities?.fileSystemAccess);

  return {
    isSupported: capabilities?.fileSystemAccess || true,
    isConfigured,
    isConnected,
    loading,
    directoryHandle,
    folderName: directoryHandle?.name || folderConfig?.folder_name || (capabilities?.isInFrame ? 'Download Automático' : ''),
    isFirstAccess: !isConfigured,
    lastError,
    errorSuggestions: lastError ? getErrorSuggestions(lastError) : [],
    configureDirectory,
    configureFolder: configureDirectory,
    saveBackup: saveData,
    saveData, // Para salvamento na pasta principal (com fallback para download)
    downloadBackup, // Para download manual/automático
    restoreFromFolder, // Para restaurar da pasta principal
    getBackupStatus: getStatus,
    getStatus,
    forceConfiguration: () => {},
    clearError,
    setShowConfigModal: () => {}
  };
};
