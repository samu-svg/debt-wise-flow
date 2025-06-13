
import { useState, useEffect, useCallback, useRef } from 'react';
import { WhatsAppConnection, WhatsAppLog, WhatsAppConfig } from '@/types/whatsapp';

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

// Declarar tipos para whatsapp-web.js
declare global {
  interface Window {
    WhatsAppWebJS: any;
  }
}

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
  const clientRef = useRef<any>(null);

  // Carregar dados salvos
  useEffect(() => {
    loadSavedData();
    loadWhatsAppWebJS();
  }, []);

  const loadWhatsAppWebJS = async () => {
    try {
      // Dinamically import whatsapp-web.js no cliente
      const { Client, LocalAuth } = await import('whatsapp-web.js');
      
      if (!clientRef.current) {
        clientRef.current = new Client({
          authStrategy: new LocalAuth({
            clientId: "debt-wise-unique"
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

        setupWhatsAppEvents();
      }
    } catch (error) {
      addLog('error', 'Erro ao carregar WhatsApp Web JS', { error });
      console.error('WhatsApp Web JS load error:', error);
    }
  };

  const setupWhatsAppEvents = () => {
    if (!clientRef.current) return;

    clientRef.current.on('qr', (qr: string) => {
      console.log('QR Code received:', qr.substring(0, 20) + '...');
      
      // Verificar se o QR code é válido (deve começar com "2@")
      if (qr.startsWith('2@')) {
        addLog('system', 'QR Code válido recebido (formato 2@)');
        
        // Gerar QR code visual usando a biblioteca qrcode
        import('qrcode').then(QRCode => {
          QRCode.toDataURL(qr, {
            width: 320,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          }).then(qrCodeDataURL => {
            saveConnection({
              ...connection,
              qrCode: qrCodeDataURL,
              status: 'connecting'
            });
            
            addLog('connection', 'QR Code pronto para escaneamento');
            scheduleQRRegen();
          }).catch(error => {
            addLog('error', 'Erro ao gerar QR Code visual', { error });
          });
        });
      } else {
        addLog('system', `QR Code recebido com formato: ${qr.substring(0, 2)}@ - aguardando formato válido 2@`);
      }
    });

    clientRef.current.on('ready', () => {
      const phoneNumber = clientRef.current.info?.wid?.user || 'Número não disponível';
      
      if (qrTimeout) {
        clearTimeout(qrTimeout);
        setQrTimeout(null);
      }

      saveConnection({
        isConnected: true,
        phoneNumber: `+${phoneNumber}`,
        lastSeen: new Date().toISOString(),
        status: 'connected',
        retryCount: 0,
        qrCode: undefined
      });

      addLog('connection', 'WhatsApp conectado com sucesso!', { phoneNumber });
      
      // Testar conexão enviando mensagem para próprio número
      testConnection(phoneNumber);
    });

    clientRef.current.on('authenticated', () => {
      addLog('system', 'WhatsApp autenticado com sucesso');
    });

    clientRef.current.on('auth_failure', (msg: string) => {
      addLog('error', 'Falha na autenticação', { message: msg });
      saveConnection({
        ...connection,
        status: 'error',
        lastError: 'Falha na autenticação'
      });
    });

    clientRef.current.on('disconnected', (reason: string) => {
      addLog('connection', 'WhatsApp desconectado', { reason });
      saveConnection({
        isConnected: false,
        status: 'disconnected',
        retryCount: 0,
        qrCode: undefined,
        phoneNumber: undefined
      });
    });
  };

  const testConnection = async (phoneNumber: string) => {
    try {
      const testMessage = `🤖 *Debt Wise Flow* - Teste de Conexão
      
Olá! Este é um teste automático para confirmar que sua conexão WhatsApp está funcionando corretamente.

✅ Conexão estabelecida com sucesso
📱 Sistema pronto para envio de cobranças
🕐 ${new Date().toLocaleString('pt-BR')}

Você pode ignorar esta mensagem.`;

      await clientRef.current.sendMessage(`${phoneNumber}@c.us`, testMessage);
      addLog('message', 'Mensagem de teste enviada com sucesso', { phoneNumber });
    } catch (error) {
      addLog('error', 'Erro ao enviar mensagem de teste', { error });
    }
  };

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
    if (connection.status !== 'connecting' || !clientRef.current) return;

    try {
      addLog('system', 'Solicitando novo QR Code...');
      // O evento 'qr' será disparado automaticamente pelo cliente
      await clientRef.current.initialize();
    } catch (error) {
      addLog('error', 'Erro ao gerar novo QR Code', { error });
      saveConnection({
        ...connection,
        status: 'error',
        lastError: 'Erro ao gerar QR Code'
      });
    }
  }, [connection, addLog]);

  const connect = useCallback(async () => {
    if (isLoading || connection.status === 'connecting') return;
    
    setIsLoading(true);
    addLog('system', 'Iniciando conexão WhatsApp Web...');

    try {
      if (!clientRef.current) {
        await loadWhatsAppWebJS();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar inicialização
      }

      if (clientRef.current) {
        saveConnection({
          ...connection,
          status: 'connecting',
          retryCount: 0,
          lastError: undefined
        });

        addLog('connection', 'Inicializando cliente WhatsApp...');
        await clientRef.current.initialize();
      } else {
        throw new Error('Cliente WhatsApp não pôde ser inicializado');
      }

    } catch (error) {
      addLog('error', 'Erro ao iniciar conexão', { error });
      saveConnection({
        ...connection,
        status: 'error',
        lastError: 'Erro ao inicializar cliente WhatsApp'
      });
    } finally {
      setIsLoading(false);
    }
  }, [connection, isLoading, addLog]);

  const disconnect = useCallback(async () => {
    if (qrTimeout) {
      clearTimeout(qrTimeout);
      setQrTimeout(null);
    }

    if (clientRef.current) {
      try {
        await clientRef.current.destroy();
        clientRef.current = null;
      } catch (error) {
        addLog('error', 'Erro ao desconectar cliente', { error });
      }
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

  // Remover função de simulação
  const simulateSuccessfulConnection = useCallback(() => {
    addLog('system', 'Simulação desabilitada - use conexão real');
  }, [addLog]);

  useEffect(() => {
    return () => {
      if (qrTimeout) {
        clearTimeout(qrTimeout);
      }
      if (clientRef.current) {
        clientRef.current.destroy().catch(console.error);
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
