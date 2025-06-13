
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
  retryInterval: 30000,
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
  const [qrTimeout, setQrTimeout] = useState<NodeJS.Timeout | null>(null);

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
        const parsed = JSON.parse(savedConnection);
        setConnection({
          ...parsed,
          isConnected: false,
          status: 'disconnected',
          qrCode: undefined
        });
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

  const generateRealQRCode = useCallback(async () => {
    try {
      // Simular dados de QR Code do WhatsApp Web real
      // Em produção, isso viria do whatsapp-web.js client.on('qr', callback)
      const qrData = `2@${Math.random().toString(36).substr(2, 15)},${Math.random().toString(36).substr(2, 15)},${Date.now()}`;
      
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      addLog('system', 'QR Code gerado com formato WhatsApp válido');
      return qrCodeDataURL;
    } catch (error) {
      addLog('error', 'Erro ao gerar QR Code', { error });
      throw error;
    }
  }, [addLog]);

  const scheduleQRRegen = useCallback(() => {
    if (qrTimeout) {
      clearTimeout(qrTimeout);
    }

    const timeout = setTimeout(() => {
      if (connection.status === 'connecting') {
        addLog('system', 'QR Code expirado após 5 minutos. Gerando novo...');
        generateNewQR();
      }
    }, 5 * 60 * 1000);

    setQrTimeout(timeout);
  }, [connection.status, addLog, qrTimeout]);

  const generateNewQR = useCallback(async () => {
    if (connection.status !== 'connecting') return;

    try {
      addLog('system', 'Gerando novo QR Code...');
      const qrCode = await generateRealQRCode();
      
      saveConnection({
        ...connection,
        qrCode,
        status: 'connecting'
      });

      addLog('connection', 'Novo QR Code pronto. Escaneie com WhatsApp.');
      scheduleQRRegen();
    } catch (error) {
      addLog('error', 'Erro ao gerar novo QR Code', { error });
      saveConnection({
        ...connection,
        status: 'error',
        lastError: 'Erro ao gerar QR Code'
      });
    }
  }, [connection, generateRealQRCode, addLog, scheduleQRRegen]);

  const connect = useCallback(async () => {
    if (isLoading || connection.status === 'connecting') return;
    
    setIsLoading(true);
    addLog('system', 'Iniciando conexão WhatsApp Web...');

    try {
      const qrCode = await generateRealQRCode();
      
      saveConnection({
        ...connection,
        status: 'connecting',
        qrCode,
        retryCount: 0,
        lastError: undefined
      });

      addLog('connection', 'QR Code gerado. Aguardando escaneamento...');
      scheduleQRRegen();

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
  }, [connection, isLoading, generateRealQRCode, addLog, scheduleQRRegen]);

  const simulateSuccessfulConnection = useCallback(() => {
    if (connection.status !== 'connecting') return;

    if (qrTimeout) {
      clearTimeout(qrTimeout);
      setQrTimeout(null);
    }

    const mockPhoneNumber = '+55 11 99999-8888';
    
    saveConnection({
      isConnected: true,
      phoneNumber: mockPhoneNumber,
      lastSeen: new Date().toISOString(),
      status: 'connected',
      retryCount: 0,
      qrCode: undefined
    });

    addLog('connection', 'WhatsApp conectado com sucesso!', { phoneNumber: mockPhoneNumber });
    addLog('system', 'Pronto para enviar mensagens');
  }, [connection.status, qrTimeout, addLog]);

  const disconnect = useCallback(() => {
    if (qrTimeout) {
      clearTimeout(qrTimeout);
      setQrTimeout(null);
    }

    saveConnection({
      isConnected: false,
      status: 'disconnected',
      retryCount: 0,
      qrCode: undefined,
      phoneNumber: undefined,
      lastError: undefined
    });

    addLog('connection', 'WhatsApp desconectado');
  }, [qrTimeout, addLog]);

  const retry = useCallback(async () => {
    if (connection.retryCount >= config.maxRetries) {
      addLog('error', 'Número máximo de tentativas excedido');
      saveConnection({
        ...connection,
        status: 'error',
        lastError: 'Máximo de tentativas excedido'
      });
      return;
    }

    const newRetryCount = connection.retryCount + 1;
    addLog('system', `Tentativa de reconexão ${newRetryCount}/${config.maxRetries}`);
    
    saveConnection({
      ...connection,
      retryCount: newRetryCount,
      status: 'disconnected',
      qrCode: undefined
    });

    setTimeout(() => {
      connect();
    }, config.retryInterval);
  }, [connection, config, connect, addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    addLog('system', 'Logs limpos');
  }, [addLog]);

  useEffect(() => {
    return () => {
      if (qrTimeout) {
        clearTimeout(qrTimeout);
      }
    };
  }, [qrTimeout]);

  return {
    connection,
    logs,
    config,
    isLoading,
    connect,
    disconnect,
    retry,
    clearLogs,
    generateNewQR,
    simulateSuccessfulConnection,
    updateConfig: saveConfig,
    addLog
  };
};
