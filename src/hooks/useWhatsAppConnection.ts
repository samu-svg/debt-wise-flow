
import { useState, useEffect, useCallback, useRef } from 'react';
import { WhatsAppConnection, WhatsAppLog, WhatsAppConfig } from '@/types/whatsapp';

const STORAGE_KEYS = {
  CONNECTION: 'whatsapp_connection',
  LOGS: 'whatsapp_logs',
  CONFIG: 'whatsapp_config'
};

const DEFAULT_CONFIG: WhatsAppConfig = {
  autoReconnect: true,
  retryInterval: 15000,
  maxRetries: 20,
  messageDelay: 2000,
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
  const wsRef = useRef<WebSocket | null>(null);
  const qrTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSavedData();
    
    return () => {
      if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
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

  // Gera QR Code real usando uma API pública
  const generateQRCode = async (data: string): Promise<string> => {
    try {
      const QRCode = await import('qrcode');
      return await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      throw error;
    }
  };

  // Conecta usando WebSocket para comunicação com backend
  const connect = useCallback(async () => {
    if (isLoading || connection.status === 'connecting') {
      addLog('system', 'Conexão já em andamento...');
      return;
    }
    
    setIsLoading(true);
    addLog('system', 'Conectando ao servidor WhatsApp...');

    try {
      // Tenta conectar via WebSocket (você precisará implementar um backend)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/whatsapp`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      saveConnection({
        ...connection,
        status: 'connecting',
        retryCount: 0,
        lastError: undefined,
        qrCode: undefined
      });

      ws.onopen = () => {
        addLog('connection', 'Conectado ao servidor WhatsApp');
        ws.send(JSON.stringify({ type: 'REQUEST_QR' }));
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'QR_CODE':
              addLog('connection', 'QR Code recebido - escaneie com seu WhatsApp');
              const qrCodeUrl = await generateQRCode(data.qr);
              saveConnection({
                ...connection,
                qrCode: qrCodeUrl,
                status: 'connecting'
              });
              break;
              
            case 'AUTHENTICATED':
              addLog('connection', 'Autenticação realizada com sucesso');
              break;
              
            case 'READY':
              const phoneNumber = data.phoneNumber || 'Número não disponível';
              saveConnection({
                isConnected: true,
                phoneNumber: phoneNumber,
                lastSeen: new Date().toISOString(),
                status: 'connected',
                retryCount: 0,
                qrCode: undefined
              });
              addLog('connection', 'WhatsApp conectado com sucesso!', { phoneNumber });
              break;
              
            case 'DISCONNECTED':
              addLog('connection', 'WhatsApp desconectado', { reason: data.reason });
              saveConnection({
                isConnected: false,
                status: 'disconnected',
                retryCount: 0,
                qrCode: undefined,
                phoneNumber: undefined
              });
              break;
              
            case 'ERROR':
              addLog('error', 'Erro na conexão WhatsApp', { error: data.error });
              saveConnection({
                ...connection,
                status: 'error',
                lastError: data.error
              });
              break;
          }
        } catch (error) {
          addLog('error', 'Erro ao processar mensagem do servidor', { error });
        }
      };

      ws.onerror = (error) => {
        addLog('error', 'Erro de conexão WebSocket - backend não disponível', { error });
        saveConnection({
          ...connection,
          status: 'error',
          lastError: 'Backend não disponível. Para usar WhatsApp real, é necessário um servidor Node.js.'
        });
      };

      ws.onclose = () => {
        addLog('connection', 'Conexão com servidor fechada');
        if (config.autoReconnect && connection.retryCount < config.maxRetries) {
          setTimeout(() => retry(), config.retryInterval);
        }
      };

      // Timeout para QR Code (2 minutos)
      qrTimeoutRef.current = setTimeout(() => {
        addLog('error', 'Timeout do QR Code - tentando novamente...');
        generateNewQR();
      }, 120000);

    } catch (error) {
      console.error('Erro ao conectar:', error);
      addLog('error', 'Erro ao conectar com servidor WhatsApp', { error });
      saveConnection({
        ...connection,
        status: 'error',
        lastError: 'Para conectar WhatsApp real, você precisa de um servidor backend Node.js rodando'
      });
    } finally {
      setIsLoading(false);
    }
  }, [connection, isLoading, addLog, config]);

  const disconnect = useCallback(async () => {
    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current);
      qrTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    saveConnection({
      isConnected: false,
      status: 'disconnected',
      retryCount: 0,
      qrCode: undefined,
      phoneNumber: undefined,
      lastError: undefined
    });

    addLog('connection', 'WhatsApp desconectado manualmente');
  }, [addLog]);

  const retry = useCallback(async () => {
    if (connection.retryCount >= config.maxRetries) {
      addLog('error', `Máximo de ${config.maxRetries} tentativas excedido`);
      saveConnection({
        ...connection,
        status: 'error',
        lastError: `Máximo de tentativas excedido (${config.maxRetries})`
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

  const generateNewQR = useCallback(async () => {
    if (connection.status === 'connecting' && wsRef.current) {
      addLog('system', 'Gerando novo QR Code...');
      wsRef.current.send(JSON.stringify({ type: 'GENERATE_NEW_QR' }));
    }
  }, [connection, addLog]);

  const sendMessage = useCallback(async (phoneNumber: string, message: string) => {
    if (!wsRef.current || !connection.isConnected) {
      throw new Error('WhatsApp não conectado');
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'SEND_MESSAGE',
        phoneNumber,
        message
      }));
      addLog('message', `Mensagem enviada para ${phoneNumber}`, { message });
    } catch (error) {
      addLog('error', `Erro ao enviar mensagem para ${phoneNumber}`, { error });
      throw error;
    }
  }, [connection.isConnected, addLog]);

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
    sendMessage,
    updateConfig: saveConfig,
    addLog
  };
};
