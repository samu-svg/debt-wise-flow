
import { useState, useCallback, useMemo } from 'react';
import type { WhatsAppConnection, WhatsAppTemplate } from '@/types/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppMetrics } from './useWhatsAppMetrics';
import { useWhatsAppConfig } from './useWhatsAppConfig';
import { useWhatsAppLogs } from './useWhatsAppLogs';

const STORAGE_KEY_CONNECTION = 'whatsapp_cloud_connection';
const STORAGE_KEY_TEMPLATES = 'whatsapp_cloud_templates';

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
  validateConfiguration: () => Promise<boolean>;
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

  // Carregar templates salvos
  const loadSavedTemplates = useCallback(() => {
    try {
      const savedTemplates = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates) as WhatsAppTemplate[];
        setTemplates(parsedTemplates);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      addLog('error', 'Erro ao carregar templates salvos', { error });
    }
  }, [addLog]);

  // Salvar templates
  const saveTemplates = useCallback((newTemplates: WhatsAppTemplate[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Erro ao salvar templates:', error);
      addLog('error', 'Erro ao salvar templates', { error });
    }
  }, [addLog]);

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

  const validateConfiguration = useCallback(async (): Promise<boolean> => {
    if (!config.accessToken || !config.phoneNumberId || !config.businessAccountId) {
      addLog('error', 'Configuração incompleta - Todos os campos são obrigatórios');
      return false;
    }

    setIsLoading(true);
    addLog('system', 'Validando configuração...');

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'validate_config',
          config
        }
      });

      if (error) {
        throw new Error(`Erro na validação: ${error.message}`);
      }

      if (data?.success && data.configValid) {
        addLog('system', 'Configuração validada com sucesso!', data);
        return true;
      } else {
        const errors = data?.errors || ['Configuração inválida'];
        addLog('error', `Configuração inválida: ${errors.join(', ')}`, data);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na validação';
      addLog('error', `Erro na validação: ${errorMessage}`, { error });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [config, addLog]);

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
        
        // Auto-carregar templates após conexão bem-sucedida
        setTimeout(() => loadTemplates(), 1000);
        
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
  }, [config, connection, addLog, saveConnection, loadTemplates]);

  const disconnect = useCallback((): void => {
    const disconnectedConnection: WhatsAppConnection = {
      isConnected: false,
      status: 'disconnected',
      retryCount: 0
    };
    
    saveConnection(disconnectedConnection);
    setTemplates([]);
    localStorage.removeItem(STORAGE_KEY_TEMPLATES);
    addLog('connection', 'WhatsApp desconectado');
  }, [addLog, saveConnection]);

  const sendMessage = useCallback(async (phoneNumber: string, message: string, templateName?: string): Promise<string> => {
    if (!connection.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    if (!phoneNumber || (!message && !templateName)) {
      throw new Error('Número e mensagem/template são obrigatórios');
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
        const logMessage = templateName 
          ? `Template "${templateName}" enviado para ${phoneNumber}`
          : `Mensagem enviada para ${phoneNumber}`;
          
        addLog('message', logMessage, { 
          messageId: data.messageId,
          message: templateName || message,
          phoneNumber,
          type: templateName ? 'template' : 'text'
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
    addLog('system', 'Carregando templates...');
    
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
        saveTemplates(loadedTemplates);
        addLog('system', `${loadedTemplates.length} templates carregados (${data.approved || 0} aprovados)`);
      } else {
        throw new Error(data?.error || 'Erro ao carregar templates');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar templates';
      addLog('error', `Erro ao carregar templates: ${errorMessage}`, { error });
    } finally {
      setIsLoading(false);
    }
  }, [config, addLog, saveTemplates]);

  // Carregar dados salvos na inicialização
  useState(() => {
    loadSavedConnection();
    loadSavedTemplates();
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
    validateConfiguration,
    clearLogs,
    updateConfig
  };
};
