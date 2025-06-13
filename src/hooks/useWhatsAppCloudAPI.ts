
import { useState, useEffect, useCallback } from 'react';
import { WhatsAppConnection, WhatsAppLog, WhatsAppConfig, WhatsAppTemplate } from '@/types/whatsapp';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEYS = {
  CONNECTION: 'whatsapp_cloud_connection',
  CONFIG: 'whatsapp_cloud_config',
  LOGS: 'whatsapp_cloud_logs'
};

const DEFAULT_CONFIG: Partial<WhatsAppConfig> = {
  messageDelay: 2000,
  businessHours: {
    enabled: false,
    start: '09:00',
    end: '18:00'
  }
};

export const useWhatsAppCloudAPI = () => {
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

  const loadSavedData = () => {
    try {
      const savedConnection = localStorage.getItem(STORAGE_KEYS.CONNECTION);
      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);

      if (savedConnection) {
        setConnection(JSON.parse(savedConnection));
      }
      if (savedConfig) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) });
      }
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }
    } catch (error) {
      addLog('error', 'Erro ao carregar dados salvos', { error });
    }
  };

  const saveConnection = (newConnection: WhatsAppConnection) => {
    localStorage.setItem(STORAGE_KEYS.CONNECTION, JSON.stringify(newConnection));
    setConnection(newConnection);
  };

  const saveConfig = (newConfig: Partial<WhatsAppConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updatedConfig));
    setConfig(updatedConfig);
  };

  const saveLogs = (newLogs: WhatsAppLog[]) => {
    const trimmedLogs = newLogs.slice(-1000);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmedLogs));
    setLogs(trimmedLogs);
  };

  const addLog = useCallback((type: WhatsAppLog['type'], message: string, data?: any) => {
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

  const testConnection = useCallback(async () => {
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

      if (data.success) {
        saveConnection({
          isConnected: true,
          status: 'connected',
          phoneNumberId: config.phoneNumberId,
          businessAccountId: config.businessAccountId,
          accessToken: config.accessToken,
          lastSeen: new Date().toISOString(),
          retryCount: 0
        });
        addLog('connection', 'Conexão estabelecida com sucesso!', data);
        return true;
      } else {
        throw new Error(data.error || 'Erro na conexão');
      }
    } catch (error: any) {
      addLog('error', `Erro na conexão: ${error.message}`, { error });
      saveConnection({
        ...connection,
        isConnected: false,
        status: 'error',
        lastError: error.message
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [config, connection, addLog]);

  const disconnect = useCallback(() => {
    saveConnection({
      isConnected: false,
      status: 'disconnected',
      retryCount: 0
    });
    addLog('connection', 'WhatsApp desconectado');
  }, [addLog]);

  const sendMessage = useCallback(async (phoneNumber: string, message: string, templateName?: string) => {
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

      if (data.success) {
        addLog('message', `Mensagem enviada para ${phoneNumber}`, { 
          messageId: data.messageId,
          message 
        });
        return data.messageId;
      } else {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }
    } catch (error: any) {
      addLog('error', `Erro ao enviar mensagem: ${error.message}`, { error });
      throw error;
    }
  }, [connection, config, addLog]);

  const loadTemplates = useCallback(async () => {
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

      if (data.success) {
        setTemplates(data.templates || []);
        addLog('system', `${data.templates?.length || 0} templates carregados`);
      }
    } catch (error: any) {
      addLog('error', `Erro ao carregar templates: ${error.message}`, { error });
    }
  }, [config, addLog]);

  const clearLogs = useCallback(() => {
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
