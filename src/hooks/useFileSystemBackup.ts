
import { useState, useEffect } from 'react';
import { useFileSystemManager } from './useFileSystemManager';
import { useUserFolderConfig } from './useUserFolderConfig';
import { useAutoFolderReconnect } from './useAutoFolderReconnect';
import { useAuth } from './useAuth';

export const useFileSystemBackup = () => {
  const { user } = useAuth();
  const { folderConfig, saveFolderConfig, isConfigured } = useUserFolderConfig();
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

  const {
    isReconnecting,
    isConnected,
    folderHandle,
    folderName,
    needsConfiguration,
    requestFolderSelection,
    attemptAutoReconnect,
    resetConfiguration,
    isSupported
  } = useAutoFolderReconnect();

  // Estado de inicialização
  useEffect(() => {
    if (isInitialized && user) {
      setLoading(false);
    } else if (isInitialized && !user) {
      setLoading(false);
    }
  }, [isInitialized, user, isReconnecting]);

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

      // Usar sistema de reconexão para solicitar nova pasta
      const success = await requestFolderSelection();
      
      if (success && folderHandle) {
        // Salvar também no banco de dados para sincronização
        await saveFolderConfig(folderHandle.name, {
          type: 'file_system_access',
          name: folderHandle.name,
          userId: user.id
        });
        
        console.log('✅ Configuração concluída para usuário:', user.id);
        return true;
      }

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
      if (!folderHandle || !capabilities?.fileSystemAccess) {
        console.log('📱 Pasta não disponível - usando fallback');
        return false;
      }
      
      // Salvar na pasta principal
      const success = await saveFile(data, filename, folderHandle);
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
    if (!folderHandle || !capabilities?.fileSystemAccess) {
      throw new Error('Pasta não disponível para restauração');
    }

    try {
      console.log('🔄 Procurando dados na pasta...');
      
      // Acessar pasta específica do usuário
      const userDataDir = await folderHandle.getDirectoryHandle('user_data');
      const userDir = await userDataDir.getDirectoryHandle(user!.id);
      
      // Procurar arquivo de dados principal
      let dataFile;
      try {
        dataFile = await userDir.getFileHandle('data.json');
      } catch {
        // Se não encontrar data.json, procurar backups
        const backupsDir = await userDir.getDirectoryHandle('backups');
        const backupFiles: string[] = [];
        
        for await (const [name] of backupsDir.entries()) {
          if (name.startsWith('backup_') && name.endsWith('.json')) {
            backupFiles.push(name);
          }
        }
        
        if (backupFiles.length === 0) {
          throw new Error('Nenhum arquivo de dados encontrado');
        }
        
        // Pegar backup mais recente
        const latestBackup = backupFiles.sort().reverse()[0];
        dataFile = await backupsDir.getFileHandle(latestBackup);
      }
      
      const file = await dataFile.getFile();
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
    if (isReconnecting) return 'Reconectando à pasta...';
    if (lastError) return `Erro: ${lastError.message}`;
    if (needsConfiguration) return 'Pasta não configurada';
    if (isConnected && folderHandle) return `✅ Conectado: ${folderHandle.name}`;
    if (isConfigured && folderConfig) return `⚠️ Pasta configurada mas desconectada: ${folderConfig.folder_name}`;
    
    return getSystemStatus();
  };

  return {
    isSupported: capabilities?.fileSystemAccess || false,
    isConfigured: isConfigured || isConnected,
    isConnected,
    loading,
    reconnecting: isReconnecting,
    directoryHandle: folderHandle,
    folderName: folderName || folderConfig?.folder_name || '',
    isFirstAccess: !isConfigured && !isConnected,
    lastError,
    errorSuggestions: lastError ? getErrorSuggestions(lastError) : [],
    configureDirectory,
    saveData,
    restoreFromFolder,
    getStatus,
    clearError,
    attemptAutoReconnect,
    resetConfiguration
  };
};
