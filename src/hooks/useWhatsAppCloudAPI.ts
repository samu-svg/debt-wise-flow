
import { useState, useEffect, useCallback, useMemo } from 'react';
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

interface WhatsAppMetrics {
  messagestoday: number;
  activeConversations: number;
  totalMessages: number;
  errorRate: number;
}

interface UseWhatsAppCloudAPIReturn {
  connection: WhatsAppConnection;
  config: Partial<WhatsAppConfig>;
  logs: WhatsAppLog[];
  templates: WhatsAppTemplate[];
  metrics: WhatsAppMetrics;
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

  // Calcular métricas reais baseadas nos logs
  const metrics = useMemo((): WhatsAppMetrics => {
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);
    const messageLogs = logs.filter(log => log.type === 'message');
    const errorLogs = logs.filter(log => log.type === 'error');
    
    return {
      messagestoday: todayLogs.filter(log => log.type === 'message').length,
      activeConversations: new Set(
        messageLogs
          .filter(log => log.data && typeof log.data === 'object' && 'phoneNumber' in log.data)
          .map(log => (log.data as any).phoneNumber)
      ).size,
      totalMessages: messageLogs.length,
      errorRate: messageLogs.length > 0 ? (errorLogs.length / messageLogs.length) * 100 : 0
    };
  }, [logs]);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = (): void => {
    try {
      const savedConnection = localStorage.getItem(STORAGE_KEYS.CONNECTION);
      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);

      if (savedConnection) {
        const parsedConnection = JSON.parse(savedConnection) as WhatsAppConnection;
        setConnection(parsedConnection);
      }
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig) as Partial<WhatsAppConfig>;
        setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
      }
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs) as WhatsAppLog[];
        setLogs(parsedLogs);
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
      addLog('error', 'Erro ao carregar dados salvos', { error });
    }
  };

  const saveConnection = useCallback((newConnection: WhatsAppConnection): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONNECTION, JSON.stringify(newConnection));
      setConnection(newConnection);
    } catch (error) {
      console.error('Erro ao salvar conexão:', error);
    }
  }, []);

  const saveConfig = useCallback((newConfig: Partial<WhatsAppConfig>): void => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updatedConfig));
      setConfig(updatedConfig);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  }, [config]);

  const saveLogs = useCallback((newLogs: WhatsAppLog[]): void => {
    try {
      // Limitar logs a 500 para evitar problemas de performance
      const trimmedLogs = newLogs.slice(-500);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmedLogs));
      setLogs(trimmedLogs);
    } catch (error) {
      console.error('Erro ao salvar logs:', error);
    }
  }, []);

  const addLog = useCallback((type: WhatsAppLog['type'], message: string, data?: unknown): void => {
    const newLog: WhatsAppLog = {
      id: `${Date.now()}-${Math.random()}`,
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
  }, [saveLogs]);

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

  const clearLogs = useCallback((): void => {
    setLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.LOGS);
      addLog('system', 'Logs limpos');
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
    }
  }, [addLog]);

  return {
    connection,
    config,
    logs,
    templates,
    metrics,
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
