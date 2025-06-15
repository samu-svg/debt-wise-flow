
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { appConfigService } from '@/services/AppConfigService';
import { folderPersistenceService } from '@/services/FolderPersistenceService';
import { toast } from '@/hooks/use-toast';

interface InitializationState {
  isInitializing: boolean;
  isReady: boolean;
  needsConfiguration: boolean;
  configError: string | null;
  folderConfigured: boolean;
  autoReconnectAttempted: boolean;
}

export const useAppInitialization = () => {
  const { user } = useAuth();
  const [state, setState] = useState<InitializationState>({
    isInitializing: false,
    isReady: false,
    needsConfiguration: false,
    configError: null,
    folderConfigured: false,
    autoReconnectAttempted: false
  });

  const initializeApp = async (userId: string) => {
    setState(prev => ({ 
      ...prev, 
      isInitializing: true, 
      configError: null,
      autoReconnectAttempted: false
    }));

    try {
      console.log('🚀 Inicializando aplicação para usuário:', userId);

      // 1. Carregar configuração salva
      let config = await appConfigService.loadConfig();

      // 2. Validar configuração existente
      if (config) {
        const validation = await appConfigService.validateConfig(config, userId);
        
        if (!validation.isValid) {
          console.warn('⚠️ Configuração inválida:', validation.errors);
          
          if (validation.needsReconfiguration) {
            console.log('🔄 Criando nova configuração para usuário');
            config = await appConfigService.createDefaultConfig(userId);
          }
        } else {
          // Atualizar sessão com login atual
          await appConfigService.updateUserSession(userId);
        }
      } else {
        // 3. Criar configuração padrão se não existir
        console.log('📝 Criando configuração inicial');
        config = await appConfigService.createDefaultConfig(userId);
      }

      // 4. Tentar reconexão automática à pasta
      let folderConfigured = false;
      let autoReconnectAttempted = false;

      if (config.dataFolderPath) {
        console.log('🔄 Tentando reconexão automática à pasta');
        autoReconnectAttempted = true;

        try {
          const reconnectResult = await folderPersistenceService.attemptAutoReconnect(userId);
          folderConfigured = reconnectResult.success;

          if (reconnectResult.success) {
            console.log('✅ Reconexão automática bem-sucedida');
            toast({
              title: "Pasta reconectada automaticamente",
              description: "Dados locais carregados com sucesso",
            });
          } else {
            console.log('⚠️ Reconexão automática falhou:', reconnectResult.error);
            // Limpar caminho inválido da configuração
            await appConfigService.updateDataFolderPath('');
          }
        } catch (error) {
          console.error('❌ Erro na reconexão automática:', error);
        }
      }

      setState(prev => ({
        ...prev,
        isReady: true,
        needsConfiguration: !folderConfigured,
        folderConfigured,
        autoReconnectAttempted
      }));

    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      setState(prev => ({
        ...prev,
        configError: error instanceof Error ? error.message : 'Erro desconhecido',
        needsConfiguration: true
      }));
    } finally {
      setState(prev => ({ ...prev, isInitializing: false }));
    }
  };

  const resetConfiguration = async () => {
    if (!user) return;

    try {
      await appConfigService.clearConfig();
      await folderPersistenceService.invalidateUserFolder(user.id);
      
      setState(prev => ({
        ...prev,
        needsConfiguration: true,
        folderConfigured: false,
        configError: null
      }));

      toast({
        title: "Configuração resetada",
        description: "Configure uma nova pasta para continuar",
      });
    } catch (error) {
      console.error('❌ Erro ao resetar configuração:', error);
      toast({
        title: "Erro ao resetar",
        description: "Não foi possível resetar a configuração",
        variant: "destructive",
      });
    }
  };

  const markFolderConfigured = async (folderPath: string) => {
    if (!user) return;

    try {
      await appConfigService.updateDataFolderPath(folderPath);
      setState(prev => ({
        ...prev,
        folderConfigured: true,
        needsConfiguration: false,
        configError: null
      }));
    } catch (error) {
      console.error('❌ Erro ao marcar pasta como configurada:', error);
    }
  };

  // Inicializar quando usuário fizer login
  useEffect(() => {
    if (user && !state.isInitializing && !state.isReady) {
      initializeApp(user.id);
    } else if (!user) {
      // Reset state quando usuário faz logout
      setState({
        isInitializing: false,
        isReady: false,
        needsConfiguration: false,
        configError: null,
        folderConfigured: false,
        autoReconnectAttempted: false
      });
    }
  }, [user]);

  return {
    ...state,
    resetConfiguration,
    markFolderConfigured,
    retry: () => user && initializeApp(user.id)
  };
};
