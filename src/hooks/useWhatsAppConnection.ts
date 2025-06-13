
import { useState, useEffect, useCallback } from 'react';
import { WhatsAppConnection, WhatsAppLog, WhatsAppConfig } from '@/types/whatsapp';
import QRCode from 'qrcode';

const STORAGE_KEYS = {
  CONNECTION: 'whatsapp_connection',
  LOGS: 'whatsapp_logs',
  CONFIG: 'whatsapp_config'
};

const DEFAULT_CONFIG: WhatsAppConfig = {
  autoReconnect: true,
  retryInterval: 30000, // 30 segundos
  maxRetries: 10,
  messageDelay: 1000,
  businessHours: {
    enabled: false,
    start: '09:00',
    end: '18:00'
  }
};

export const useWhatsAppConnection = () => {
  const [connection, setConnection] = useState<WhatsAppConnection>({
    isConnected: false,
    status: 'disconnected',
    retryCount: 0
  });
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [config, setConfig] = useState<WhatsAppConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar dados salvos
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = () => {
    try {
      const savedConnection = localStorage.getItem(STORAGE_KEYS.CONNECTION);
      const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);

      if (savedConnection) {
        setConnection(JSON.parse(savedConnection));
      }
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      addLog('error', 'Erro ao carregar dados salvos', { error });
    }
  };

  const saveConnection = (newConnection: WhatsAppConnection) => {
    localStorage.setItem(STORAGE_KEYS.CONNECTION, JSON.stringify(newConnection));
    setConnection(newConnection);
  };

  const saveLogs = (newLogs: WhatsAppLog[]) => {
    // Manter apenas os últimos 1000 logs
    const trimmedLogs = newLogs.slice(-1000);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmedLogs));
    setLogs(trimmedLogs);
  };

  const saveConfig = (newConfig: WhatsAppConfig) => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
    setConfig(newConfig);
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

  const generateQRCode = useCallback(async () => {
    try {
      // Simular dados de QR Code para WhatsApp Web
      const qrData = `whatsapp-web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      addLog('error', 'Erro ao gerar QR Code', { error });
      throw error;
    }
  }, [addLog]);

  const connect = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    addLog('system', 'Iniciando conexão com WhatsApp...');

    try {
      saveConnection({
        ...connection,
        status: 'connecting',
        retryCount: 0
      });

      // Gerar QR Code
      const qrCode = await generateQRCode();
      
      saveConnection({
        ...connection,
        status: 'connecting',
        qrCode,
        retryCount: 0
      });

      addLog('connection', 'QR Code gerado. Aguardando scan no WhatsApp...');

      // Simular processo de conexão (em produção seria o whatsapp-web.js)
      setTimeout(() => {
        simulateConnection();
      }, 5000);

    } catch (error) {
      addLog('error', 'Erro ao iniciar conexão', { error });
      saveConnection({
        ...connection,
        status: 'error',
        lastError: 'Erro ao gerar QR Code'
      });
    } finally {
      setIsLoading(false);
    }
  }, [connection, isLoading, generateQRCode, addLog]);

  const simulateConnection = () => {
    // Simular sucesso na conexão
    const phoneNumber = '+55 11 99999-8888'; // Número simulado
    
    saveConnection({
      isConnected: true,
      phoneNumber,
      lastSeen: new Date().toISOString(),
      status: 'connected',
      retryCount: 0,
      qrCode: undefined
    });

    addLog('connection', 'WhatsApp conectado com sucesso!', { phoneNumber });
    
    // Iniciar monitoramento de status
    startStatusMonitoring();
  };

  const disconnect = useCallback(() => {
    saveConnection({
      isConnected: false,
      status: 'disconnected',
      retryCount: 0,
      qrCode: undefined,
      phoneNumber: undefined
    });

    addLog('connection', 'WhatsApp desconectado');
    stopStatusMonitoring();
  }, [addLog]);

  const retry = useCallback(async () => {
    if (connection.retryCount >= config.maxRetries) {
      addLog('error', 'Número máximo de tentativas excedido');
      return;
    }

    const newRetryCount = connection.retryCount + 1;
    saveConnection({
      ...connection,
      retryCount: newRetryCount
    });

    addLog('system', `Tentativa de reconexão ${newRetryCount}/${config.maxRetries}`);
    
    setTimeout(() => {
      connect();
    }, config.retryInterval);
  }, [connection, config, connect, addLog]);

  // Monitoramento de status em tempo real
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null);

  const startStatusMonitoring = useCallback(() => {
    if (statusInterval) return;

    const interval = setInterval(() => {
      // Simular verificação de status (em produção seria verificação real)
      const isStillConnected = Math.random() > 0.1; // 90% chance de estar conectado
      
      if (!isStillConnected && connection.isConnected) {
        addLog('connection', 'Conexão perdida. Tentando reconectar...');
        if (config.autoReconnect) {
          retry();
        }
      } else if (connection.isConnected) {
        saveConnection({
          ...connection,
          lastSeen: new Date().toISOString()
        });
      }
    }, 10000); // Verificar a cada 10 segundos

    setStatusInterval(interval);
  }, [connection, config.autoReconnect, retry, addLog, statusInterval]);

  const stopStatusMonitoring = useCallback(() => {
    if (statusInterval) {
      clearInterval(statusInterval);
      setStatusInterval(null);
    }
  }, [statusInterval]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    addLog('system', 'Logs limpos');
  }, [addLog]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      stopStatusMonitoring();
    };
  }, [stopStatusMonitoring]);

  return {
    connection,
    logs,
    config,
    isLoading,
    connect,
    disconnect,
    retry,
    clearLogs,
    updateConfig: saveConfig,
    addLog
  };
};
