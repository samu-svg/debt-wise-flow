
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
  const clientRef = useRef<any>(null);
  const qrTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSavedData();
    
    return () => {
      if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      
      if (clientRef.current) {
        clientRef.current.destroy().catch(console.error);
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

  const connect = useCallback(async () => {
    if (isLoading || connection.status === 'connecting') {
      addLog('system', 'Conexão já em andamento...');
      return;
    }
    
    setIsLoading(true);
    addLog('system', 'Iniciando conexão real com WhatsApp Web...');

    try {
      // Verificar se whatsapp-web.js está disponível
      const { Client, LocalAuth } = await import('whatsapp-web.js');
      
      if (clientRef.current) {
        await clientRef.current.destroy();
        clientRef.current = null;
      }

      // Criar cliente WhatsApp Web real
      const client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp-session'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      clientRef.current = client;

      saveConnection({
        ...connection,
        status: 'connecting',
        retryCount: 0,
        lastError: undefined,
        qrCode: undefined
      });

      // Event listeners
      client.on('qr', (qr: string) => {
        addLog('connection', 'QR Code gerado - escaneie com seu WhatsApp');
        console.log('QR Code recebido:', qr);
        
        // Gerar QR code usando a biblioteca qrcode
        import('qrcode').then(QRCode => {
          QRCode.toDataURL(qr, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          }).then(qrCodeUrl => {
            saveConnection({
              ...connection,
              qrCode: qrCodeUrl,
              status: 'connecting'
            });
          }).catch(err => {
            console.error('Erro ao gerar QR Code:', err);
            addLog('error', 'Erro ao gerar QR Code visual', { err });
          });
        });
      });

      client.on('authenticated', () => {
        addLog('connection', 'Autenticação realizada com sucesso');
      });

      client.on('ready', () => {
        const clientInfo = client.info;
        const phoneNumber = clientInfo?.wid?.user || clientInfo?.me?.user || 'Número não disponível';
        
        saveConnection({
          isConnected: true,
          phoneNumber: `+${phoneNumber}`,
          lastSeen: new Date().toISOString(),
          status: 'connected',
          retryCount: 0,
          qrCode: undefined
        });

        addLog('connection', 'WhatsApp conectado com sucesso!', { phoneNumber });
        addLog('system', 'Sistema de cobrança automática ativado');
        
        if (qrTimeoutRef.current) {
          clearTimeout(qrTimeoutRef.current);
          qrTimeoutRef.current = null;
        }
      });

      client.on('auth_failure', (msg: string) => {
        addLog('error', 'Falha na autenticação WhatsApp', { msg });
        saveConnection({
          ...connection,
          status: 'error',
          lastError: 'Falha na autenticação - tente escanear novamente'
        });
        
        if (config.autoReconnect && connection.retryCount < config.maxRetries) {
          setTimeout(() => retry(), config.retryInterval);
        }
      });

      client.on('disconnected', (reason: string) => {
        addLog('connection', 'WhatsApp desconectado', { reason });
        
        saveConnection({
          isConnected: false,
          status: 'disconnected',
          retryCount: 0,
          qrCode: undefined,
          phoneNumber: undefined
        });
        
        if (config.autoReconnect && connection.retryCount < config.maxRetries) {
          addLog('system', `Auto-reconectando em ${config.retryInterval/1000}s...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, config.retryInterval);
        }
      });

      // Timeout para QR Code (2 minutos)
      qrTimeoutRef.current = setTimeout(() => {
        addLog('error', 'Timeout do QR Code - gerando novo...');
        generateNewQR();
      }, 120000);

      await client.initialize();

    } catch (error) {
      console.error('Erro ao inicializar WhatsApp Web:', error);
      addLog('error', 'Erro crítico na conexão WhatsApp', { error });
      saveConnection({
        ...connection,
        status: 'error',
        lastError: 'Erro crítico - verifique se o whatsapp-web.js está instalado corretamente'
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

    if (clientRef.current) {
      try {
        await clientRef.current.destroy();
      } catch (error) {
        console.error('Erro ao finalizar cliente:', error);
      }
      clientRef.current = null;
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
    if (connection.status === 'connecting' && clientRef.current) {
      addLog('system', 'Gerando novo QR Code...');
      await disconnect();
      setTimeout(() => connect(), 1000);
    }
  }, [connection, addLog, disconnect, connect]);

  const sendMessage = useCallback(async (phoneNumber: string, message: string) => {
    if (!clientRef.current || !connection.isConnected) {
      throw new Error('WhatsApp não conectado');
    }

    try {
      const chatId = `${phoneNumber}@c.us`;
      const result = await clientRef.current.sendMessage(chatId, message);
      addLog('message', `Mensagem enviada para ${phoneNumber}`, { message });
      return result;
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
