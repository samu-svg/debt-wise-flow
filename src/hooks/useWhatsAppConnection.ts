
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
        // Reset connection status on reload to prevent false connections
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

  const generateQRCode = useCallback(async () => {
    try {
      // Gerar QR Code único para cada tentativa de conexão
      const timestamp = Date.now();
      const sessionId = Math.random().toString(36).substr(2, 9);
      const qrData = `whatsapp-session-${timestamp}-${sessionId}`;
      
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      return qrCodeDataURL;
    } catch (error) {
      addLog('error', 'Erro ao gerar QR Code', { error });
      throw error;
    }
  }, [addLog]);

  const scheduleQRRegen = useCallback(() => {
    // Limpar timeout anterior se existir
    if (qrTimeout) {
      clearTimeout(qrTimeout);
    }

    // Agendar regeneração do QR Code em 5 minutos
    const timeout = setTimeout(() => {
      if (connection.status === 'connecting') {
        addLog('system', 'QR Code expirado. Gerando novo...');
        generateNewQR();
      }
    }, 5 * 60 * 1000); // 5 minutos

    setQrTimeout(timeout);
  }, [connection.status, addLog, qrTimeout]);

  const generateNewQR = useCallback(async () => {
    if (connection.status !== 'connecting') return;

    try {
      const qrCode = await generateQRCode();
      
      saveConnection({
        ...connection,
        qrCode,
        status: 'connecting'
      });

      addLog('system', 'Novo QR Code gerado. Escaneie com seu WhatsApp.');
      scheduleQRRegen();
    } catch (error) {
      addLog('error', 'Erro ao gerar novo QR Code', { error });
    }
  }, [connection, generateQRCode, addLog, scheduleQRRegen]);

  const connect = useCallback(async () => {
    if (isLoading || connection.status === 'connecting') return;
    
    setIsLoading(true);
    addLog('system', 'Iniciando processo de conexão...');

    try {
      // Gerar QR Code inicial
      const qrCode = await generateQRCode();
      
      saveConnection({
        ...connection,
        status: 'connecting',
        qrCode,
        retryCount: 0,
        lastError: undefined
      });

      addLog('connection', 'QR Code gerado. Abra o WhatsApp e escaneie o código.');
      addLog('system', 'Aguardando escaneamento manual...');

      // Agendar regeneração automática do QR Code
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
  }, [connection, isLoading, generateQRCode, addLog, scheduleQRRegen]);

  const simulateManualConnection = useCallback(async () => {
    // Esta função simula o que aconteceria quando o usuário escaneia o QR Code
    // Em produção, seria chamada pelo whatsapp-web.js quando detecta o scan
    if (connection.status !== 'connecting') return;

    const phoneNumber = '+55 11 99999-8888'; // Em produção, viria do WhatsApp
    
    // Limpar timeout do QR Code
    if (qrTimeout) {
      clearTimeout(qrTimeout);
      setQrTimeout(null);
    }

    saveConnection({
      isConnected: true,
      phoneNumber,
      lastSeen: new Date().toISOString(),
      status: 'connected',
      retryCount: 0,
      qrCode: undefined
    });

    addLog('connection', 'WhatsApp conectado com sucesso!', { phoneNumber });
    addLog('system', 'Conexão estabelecida e pronta para uso');
  }, [connection.status, qrTimeout, addLog]);

  const disconnect = useCallback(() => {
    // Limpar timeout se existir
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

    addLog('connection', 'WhatsApp desconectado pelo usuário');
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
    
    // Reset connection state for retry
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
    addLog('system', 'Logs limpos pelo usuário');
  }, [addLog]);

  // Cleanup no unmount
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
    simulateManualConnection, // Para testes - remover em produção
    updateConfig: saveConfig,
    addLog
  };
};
