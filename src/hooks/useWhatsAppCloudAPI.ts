
import { useState, useEffect, useCallback } from 'react';
import type { WhatsAppConnection, WhatsAppLog, WhatsAppConfig, WhatsAppTemplate } from '@/types/whatsapp';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEYS = {
  CONNECTION: 'whatsapp_cloud_connection',
  CONFIG: 'whatsapp_cloud_config',
  LOGS: 'whatsapp_cloud_logs'
} as const;

const DEFAULT_CONFIG: Partial<WhatsAppConfig> = {
  messageDelay: 2000,
  autoReconnect: true,
  retryInterval: 15000,
  maxRetries: 5,
  businessHours: {
    enabled: false,
    start: '09:00',
    end: '18:00'
  }
} as const;

interface UseWhatsAppCloudAPIReturn {
  connection: WhatsAppConnection;
  config: Partial<WhatsAppConfig>;
  logs: WhatsAppLog[];
  templates: WhatsAppTemplate[];
  isLoading: boolean;
  testConnection: () => Promise<boolean>;
  disconnect: () => void;
  sendMessage: (phoneNumber: string, message: string, templateName?: string) => Promise<string>;
  loadTemplates: () => Promise<void>;
  clearLogs: () => void;
  updateConfig: (newConfig: Partial<WhatsAppConfig>) => void;
  addLog: (type: WhatsAppLog['type'], message: string, data?: unknown) => void;
}

export const useWhatsAppCloudAPI = (): UseWhatsAppCloudAPIReturn => {
  const [connection, setConnection] = useState<WhatsAppConnection>({
    isConnected: false,
    status: 'disconnected',
    retryCount: 0
  });
  
  const [config, setConfig] = useState<Partial<WhatsAppConfig>>(DEFAULT_CONFIG);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = (): void => {
    try {
      const savedConnection = localStorage.getItem(STORAGE_KEYS.CONNECTION);
      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);

      if (savedConnection) {
        setConnection(JSON.parse(savedConnection) as WhatsAppConnection);
      }
      if (savedConfig) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) as Partial<WhatsAppConfig> });
      }
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs) as WhatsAppLog[]);
      }
    } catch (error) {
      addLog('error', 'Erro ao carregar dados salvos', { error });
    }
  };

  const saveConnection = (newConnection: WhatsAppConnection): void => {
    localStorage.setItem(STORAGE_KEYS.CONNECTION, JSON.stringify(newConnection));
    setConnection(newConnection);
  };

  const saveConfig = (newConfig: Partial<WhatsAppConfig>): void => {
    const updatedConfig = { ...config, ...newConfig };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updatedConfig));
    setConfig(updatedConfig);
  };

  const saveLogs = (newLogs: WhatsAppLog[]): void => {
    const trimmedLogs = newLogs.slice(-1000);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmedLogs));
    setLogs(trimmedLogs);
  };

  const addLog = useCallback((type: WhatsAppLog['type'], message: string, data?: unknown): void => {
    const newLog: WhatsAppLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };

    setLogs(currentLogs => {
      const updatedLogs = [...currentLogs, newLog];
      saveLogs(updatedLogs);
      return updatedLogs;
    });
  }, []);

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

      if (error) throw error;

      if (data?.success) {
        saveConnection({
          isConnected: true,
          status: 'connected',
          phoneNumberId: config.phoneNumberId,
          phoneNumber: data.data?.phoneNumber,
          businessAccountId: config.businessAccountId,
          accessToken: config.accessToken,
          lastSeen: new Date().toISOString(),
          retryCount: 0
        });
        addLog('connection', 'Conexão estabelecida com sucesso!', data);
        return true;
      } else {
        throw new Error(data?.error || 'Erro na conexão');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `Erro na conexão: ${errorMessage}`, { error });
      saveConnection({
        ...connection,
        isConnected: false,
        status: 'error',
        lastError: errorMessage
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [config, connection, addLog]);

  const disconnect = useCallback((): void => {
    saveConnection({
      isConnected: false,
      status: 'disconnected',
      retryCount: 0
    });
    addLog('connection', 'WhatsApp desconectado');
  }, [addLog]);

  const sendMessage = useCallback(async (phoneNumber: string, message: string, templateName?: string): Promise<string> => {
    if (!connection.isConnected) {
      throw new Error('WhatsApp não está conectado');
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

      if (error) throw error;

      if (data?.success) {
        addLog('message', `Mensagem enviada para ${phoneNumber}`, { 
          messageId: data.messageId,
          message 
        });
        return data.messageId as string;
      } else {
        throw new Error(data?.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `Erro ao enviar mensagem: ${errorMessage}`, { error });
      throw error;
    }
  }, [connection, config, addLog]);

  const loadTemplates = useCallback(async (): Promise<void> => {
    if (!config.accessToken || !config.businessAccountId) {
      addLog('error', 'Configuração incompleta para carregar templates');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'get_templates',
          config
        }
      });

      if (error) throw error;

      if (data?.success) {
        setTemplates(data.templates || []);
        addLog('system', `${data.templates?.length || 0} templates carregados`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `Erro ao carregar templates: ${errorMessage}`, { error });
    }
  }, [config, addLog]);

  const clearLogs = useCallback((): void => {
    setLogs([]);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    addLog('system', 'Logs limpos');
  }, [addLog]);

  return {
    connection,
    config,
    logs,
    templates,
    isLoading,
    testConnection,
    disconnect,
    sendMessage,
    loadTemplates,
    clearLogs,
    updateConfig: saveConfig,
    addLog
  };
};
