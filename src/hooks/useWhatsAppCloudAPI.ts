
import { useState, useCallback, useMemo } from 'react';
import type { WhatsAppConnection, WhatsAppTemplate } from '@/types/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppMetrics } from './useWhatsAppMetrics';
import { useWhatsAppConfig } from './useWhatsAppConfig';
import { useWhatsAppLogs } from './useWhatsAppLogs';

const STORAGE_KEY_CONNECTION = 'whatsapp_cloud_connection';

interface UseWhatsAppCloudAPIReturn {
  connection: WhatsAppConnection;
  config: Partial<import('@/types/whatsapp').WhatsAppConfig>;
  logs: import('@/types/whatsapp').WhatsAppLog[];
  templates: WhatsAppTemplate[];
  metrics: ReturnType<typeof useWhatsAppMetrics>;
  logStats: ReturnType<typeof useWhatsAppLogs>['logStats'];
  isLoading: boolean;
  isConfigDirty: boolean;
  testConnection: () => Promise<boolean>;
  disconnect: () => void;
  sendMessage: (phoneNumber: string, message: string, templateName?: string) => Promise<string>;
  loadTemplates: () => Promise<void>;
  clearLogs: () => void;
  updateConfig: (newConfig: Partial<import('@/types/whatsapp').WhatsAppConfig>) => void;
}

export const useWhatsAppCloudAPI = (): UseWhatsAppCloudAPIReturn => {
  const [connection, setConnection] = useState<WhatsAppConnection>({
    isConnected: false,
    status: 'disconnected',
    retryCount: 0
  });
  
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Usar hooks especializados
  const { config, updateConfig, isConfigDirty } = useWhatsAppConfig();
  const { logs, logStats, addLog, clearLogs } = useWhatsAppLogs();
  const metrics = useWhatsAppMetrics(logs);

  // Carregar conexão salva
  const loadSavedConnection = useCallback(() => {
    try {
      const savedConnection = localStorage.getItem(STORAGE_KEY_CONNECTION);
      if (savedConnection) {
        const parsedConnection = JSON.parse(savedConnection) as WhatsAppConnection;
        setConnection(parsedConnection);
      }
    } catch (error) {
      console.error('Erro ao carregar conexão:', error);
      addLog('error', 'Erro ao carregar dados da conexão', { error });
    }
  }, [addLog]);

  // Memoizar função de salvamento de conexão
  const saveConnection = useCallback((newConnection: WhatsAppConnection): void => {
    try {
      localStorage.setItem(STORAGE_KEY_CONNECTION, JSON.stringify(newConnection));
      setConnection(newConnection);
    } catch (error) {
      console.error('Erro ao salvar conexão:', error);
      addLog('error', 'Erro ao salvar dados da conexão', { error });
    }
  }, [addLog]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!config.accessToken || !config.phoneNumberId) {
      addLog('error', 'Configuração incompleta - Token de acesso e ID do número são obrigatórios');
      return false;
    }

    setIsLoading(true);
    addLog('system', 'Testando conexão com WhatsApp Cloud API...');

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'test_connection',
          config
        }
      });

      if (error) {
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        const newConnection: WhatsAppConnection = {
          isConnected: true,
          status: 'connected',
          phoneNumberId: config.phoneNumberId,
          phoneNumber: data.data?.phoneNumber,
          businessAccountId: config.businessAccountId,
          accessToken: config.accessToken,
          lastSeen: new Date().toISOString(),
          retryCount: 0
        };
        
        saveConnection(newConnection);
        addLog('connection', 'Conexão estabelecida com sucesso!', data.data);
        return true;
      } else {
        throw new Error(data?.error || 'Erro na conexão');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na conexão';
      addLog('error', `Erro na conexão: ${errorMessage}`, { error });
      
      const errorConnection: WhatsAppConnection = {
        ...connection,
        isConnected: false,
        status: 'error',
        lastError: errorMessage,
        retryCount: connection.retryCount + 1
      };
      
      saveConnection(errorConnection);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [config, connection, addLog, saveConnection]);

  const disconnect = useCallback((): void => {
    const disconnectedConnection: WhatsAppConnection = {
      isConnected: false,
      status: 'disconnected',
      retryCount: 0
    };
    
    saveConnection(disconnectedConnection);
    addLog('connection', 'WhatsApp desconectado');
  }, [addLog, saveConnection]);

  const sendMessage = useCallback(async (phoneNumber: string, message: string, templateName?: string): Promise<string> => {
    if (!connection.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    if (!phoneNumber || !message) {
      throw new Error('Número e mensagem são obrigatórios');
    }

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'send_message',
          phoneNumber,
          message,
          templateName,
          config
        }
      });

      if (error) {
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        addLog('message', `Mensagem enviada para ${phoneNumber}`, { 
          messageId: data.messageId,
          message,
          phoneNumber
        });
        return data.messageId as string;
      } else {
        throw new Error(data?.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao enviar mensagem';
      addLog('error', `Erro ao enviar mensagem: ${errorMessage}`, { error, phoneNumber });
      throw error;
    }
  }, [connection, config, addLog]);

  const loadTemplates = useCallback(async (): Promise<void> => {
    if (!config.accessToken || !config.businessAccountId) {
      addLog('error', 'Configuração incompleta para carregar templates');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'get_templates',
          config
        }
      });

      if (error) {
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        const loadedTemplates = data.templates || [];
        setTemplates(loadedTemplates);
        addLog('system', `${loadedTemplates.length} templates carregados`);
      } else {
        throw new Error(data?.error || 'Erro ao carregar templates');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar templates';
      addLog('error', `Erro ao carregar templates: ${errorMessage}`, { error });
    } finally {
      setIsLoading(false);
    }
  }, [config, addLog]);

  // Carregar dados salvos na inicialização
  useState(() => {
    loadSavedConnection();
  });

  return {
    connection,
    config,
    logs,
    templates,
    metrics,
    logStats,
    isLoading,
    isConfigDirty,
    testConnection,
    disconnect,
    sendMessage,
    loadTemplates,
    clearLogs,
    updateConfig
  };
};
