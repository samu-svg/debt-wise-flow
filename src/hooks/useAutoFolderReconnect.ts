
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { folderPersistenceService } from '@/services/FolderPersistenceService';
import { toast } from '@/hooks/use-toast';

interface AutoReconnectState {
  isReconnecting: boolean;
  isConnected: boolean;
  folderHandle: FileSystemDirectoryHandle | null;
  folderName: string | null;
  lastError: string | null;
  needsConfiguration: boolean;
}

export const useAutoFolderReconnect = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AutoReconnectState>({
    isReconnecting: false,
    isConnected: false,
    folderHandle: null,
    folderName: null,
    lastError: null,
    needsConfiguration: false
  });

  // Função para solicitar nova pasta
  const requestFolderSelection = async (): Promise<boolean> => {
    if (!user || !('showDirectoryPicker' in window)) {
      return false;
    }

    try {
      setState(prev => ({ ...prev, isReconnecting: true, lastError: null }));

      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      // Validar e salvar nova configuração
      const validation = await folderPersistenceService.validateFolderAccess(handle, user.id);
      
      if (!validation.hasWritePermission) {
        throw new Error('Pasta selecionada não tem permissão de escrita');
      }

      // Salvar configuração
      await folderPersistenceService.saveUserFolderConfig(user.id, handle);

      // Garantir estrutura de dados
      await folderPersistenceService.ensureUserDataStructure(handle, user.id);

      setState(prev => ({
        ...prev,
        isConnected: true,
        folderHandle: handle,
        folderName: handle.name,
        needsConfiguration: false,
        lastError: null
      }));

      toast({
        title: "Pasta configurada com sucesso!",
        description: `Dados serão salvos em: ${handle.name}`,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        ...prev,
        lastError: errorMessage,
        needsConfiguration: true
      }));

      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Erro ao configurar pasta",
          description: errorMessage,
          variant: "destructive",
        });
      }

      return false;
    } finally {
      setState(prev => ({ ...prev, isReconnecting: false }));
    }
  };

  // Função principal de reconexão automática
  const attemptAutoReconnect = async (): Promise<void> => {
    if (!user) return;

    setState(prev => ({ ...prev, isReconnecting: true, lastError: null }));

    try {
      console.log('🔄 Iniciando reconexão automática para:', user.email);

      const result = await folderPersistenceService.attemptAutoReconnect(user.id);

      if (result.success && result.handle) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          folderHandle: result.handle!,
          folderName: result.handle!.name,
          needsConfiguration: false,
          lastError: null
        }));

        console.log('✅ Reconexão automática bem-sucedida');
        
        toast({
          title: "Pasta reconectada automaticamente",
          description: `Conectado à: ${result.handle.name}`,
        });
      } else {
        console.log('⚠️ Reconexão automática falhou:', result.error);
        
        setState(prev => ({
          ...prev,
          isConnected: false,
          folderHandle: null,
          folderName: null,
          needsConfiguration: true,
          lastError: result.error || 'Falha na reconexão'
        }));

        // Não mostrar toast de erro imediatamente - apenas marcar como necessitando configuração
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na reconexão';
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        folderHandle: null,
        folderName: null,
        needsConfiguration: true,
        lastError: errorMessage
      }));

      console.error('❌ Erro na reconexão automática:', error);
    } finally {
      setState(prev => ({ ...prev, isReconnecting: false }));
    }
  };

  // Executar reconexão automática quando usuário fizer login
  useEffect(() => {
    if (user && !state.isReconnecting && !state.isConnected) {
      const timer = setTimeout(() => {
        attemptAutoReconnect();
      }, 1000); // Aguardar 1 segundo após login

      return () => clearTimeout(timer);
    }
  }, [user]);

  // Função para forçar nova configuração
  const resetConfiguration = async (): Promise<void> => {
    if (!user) return;

    try {
      await folderPersistenceService.invalidateUserFolder(user.id);
      setState(prev => ({
        ...prev,
        isConnected: false,
        folderHandle: null,
        folderName: null,
        needsConfiguration: true,
        lastError: null
      }));

      toast({
        title: "Configuração resetada",
        description: "Selecione uma nova pasta para continuar",
      });
    } catch (error) {
      console.error('Erro ao resetar configuração:', error);
    }
  };

  return {
    ...state,
    requestFolderSelection,
    attemptAutoReconnect,
    resetConfiguration,
    isSupported: 'showDirectoryPicker' in window
  };
};
