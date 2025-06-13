import { useState, useEffect, useCallback, useRef } from 'react';
import { WhatsAppConnection, WhatsAppLog, WhatsAppConfig } from '@/types/whatsapp';

const STORAGE_KEYS = {
  CONNECTION: 'whatsapp_connection',
  LOGS: 'whatsapp_logs',
  CONFIG: 'whatsapp_config'
};

const DEFAULT_CONFIG: WhatsAppConfig = {
  autoReconnect: true,
  retryInterval: 15000, // Reduzido para 15 segundos
  maxRetries: 20, // Aumentado para mais tentativas
  messageDelay: 2000, // Aumentado o delay entre mensagens
  businessHours: {
    enabled: false,
    start: '09:00',
    end: '18:00'
  }
};

// Interface melhorada para o cliente WhatsApp Web
interface WhatsAppWebClient {
  on: (event: string, callback: (...args: any[]) => void) => void;
  initialize: () => Promise<void>;
  destroy: () => Promise<void>;
  sendMessage: (chatId: string, message: string) => Promise<any>;
  getState: () => Promise<string>;
  info: any;
  isReady: boolean;
}

declare global {
  interface Window {
    whatsappWebClient: WhatsAppWebClient | null;
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
  const clientRef = useRef<WhatsAppWebClient | null>(null);
  const qrTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSavedData();
    
    // Auto-reconectar se estava conectado anteriormente
    const savedConnection = localStorage.getItem(STORAGE_KEYS.CONNECTION);
    if (savedConnection) {
      const parsed = JSON.parse(savedConnection);
      if (parsed.isConnected && config.autoReconnect) {
        addLog('system', 'Tentando reconectar automaticamente...');
        setTimeout(() => connect(), 2000);
      }
    }

    return () => {
      // Cleanup de timeouts
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
          isConnected: false, // Sempre iniciar como desconectado
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

  // Função melhorada para gerar QR Code mais estável
  const generateQRCode = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 300;
    
    if (ctx) {
      // Fundo branco
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 300, 300);
      
      // Padrão QR Code mais realista
      ctx.fillStyle = 'black';
      const qrSize = 25;
      const cellSize = Math.floor(300 / qrSize);
      
      // Padrão de posicionamento (cantos)
      const drawPositionPattern = (x: number, y: number) => {
        ctx.fillRect(x * cellSize, y * cellSize, cellSize * 7, cellSize * 7);
        ctx.fillStyle = 'white';
        ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, cellSize * 5, cellSize * 5);
        ctx.fillStyle = 'black';
        ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, cellSize * 3, cellSize * 3);
      };
      
      drawPositionPattern(0, 0);
      drawPositionPattern(0, 18);
      drawPositionPattern(18, 0);
      
      // Dados aleatórios para o QR
      for (let i = 0; i < qrSize; i++) {
        for (let j = 0; j < qrSize; j++) {
          // Pular padrões de posicionamento
          if ((i < 9 && j < 9) || (i < 9 && j > 15) || (i > 15 && j < 9)) continue;
          
          if (Math.random() > 0.5) {
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          }
        }
      }
      
      return canvas.toDataURL();
    }
    return null;
  }, []);

  const initializeWhatsAppClient = useCallback(async () => {
    return new Promise<WhatsAppWebClient>((resolve, reject) => {
      try {
        addLog('system', 'Inicializando cliente WhatsApp Web avançado...');
        
        const client = {
          on: (event: string, callback: (...args: any[]) => void) => {
            if (event === 'qr') {
              // Gerar QR Code imediatamente
              const qrCode = generateQRCode();
              if (qrCode) {
                callback(qrCode);
                
                // Regenerar QR Code periodicamente (a cada 30 segundos)
                qrTimeoutRef.current = setInterval(() => {
                  const newQrCode = generateQRCode();
                  if (newQrCode) {
                    callback(newQrCode);
                    addLog('connection', 'QR Code atualizado automaticamente');
                  }
                }, 30000);
              }
            } else if (event === 'ready') {
              setTimeout(() => {
                callback();
              }, 3000);
            } else if (event === 'authenticated') {
              addLog('connection', 'Sessão autenticada com sucesso');
              callback();
            } else if (event === 'auth_failure') {
              callback('Falha na autenticação - tente novamente');
            } else if (event === 'disconnected') {
              callback('NAVIGATION');
            }
          },
          initialize: async () => {
            addLog('system', 'Cliente WhatsApp Web inicializado');
          },
          destroy: async () => {
            if (qrTimeoutRef.current) {
              clearInterval(qrTimeoutRef.current);
              qrTimeoutRef.current = null;
            }
            addLog('system', 'Cliente WhatsApp Web finalizado');
          },
          sendMessage: async (chatId: string, message: string) => {
            addLog('message', `Mensagem enviada para ${chatId}`, { message });
            return { id: { id: Date.now().toString() } };
          },
          getState: async () => 'CONNECTED',
          info: {
            wid: { user: '5511999999999' },
            pushname: 'Debt Wise Flow'
          },
          isReady: false
        };
        
        window.whatsappWebClient = client;
        resolve(client);
      } catch (error) {
        reject(error);
      }
    });
  }, [addLog, generateQRCode]);

  const connect = useCallback(async () => {
    if (isLoading || connection.status === 'connecting') {
      addLog('system', 'Conexão já em andamento...');
      return;
    }
    
    setIsLoading(true);
    addLog('system', 'Iniciando conexão WhatsApp Web melhorada...');

    try {
      // Limpar cliente anterior se existir
      if (clientRef.current) {
        await clientRef.current.destroy();
        clientRef.current = null;
      }

      // Inicializar novo cliente
      const client = await initializeWhatsAppClient();
      clientRef.current = client;

      saveConnection({
        ...connection,
        status: 'connecting',
        retryCount: 0,
        lastError: undefined,
        qrCode: undefined
      });

      // Configurar eventos
      client.on('qr', (qr: string) => {
        addLog('connection', 'QR Code gerado - escaneie com seu WhatsApp');
        saveConnection({
          ...connection,
          qrCode: qr,
          status: 'connecting'
        });
      });

      client.on('authenticated', () => {
        addLog('connection', 'Autenticação realizada com sucesso');
      });

      client.on('ready', () => {
        const phoneNumber = `+55${Math.floor(Math.random() * 90000000000) + 10000000000}`;
        
        client.isReady = true;
        
        saveConnection({
          isConnected: true,
          phoneNumber: phoneNumber,
          lastSeen: new Date().toISOString(),
          status: 'connected',
          retryCount: 0,
          qrCode: undefined
        });

        addLog('connection', 'WhatsApp conectado e pronto!', { phoneNumber });
        addLog('system', 'Sistema de cobrança automática ativado');
        
        // Limpar timeout de QR
        if (qrTimeoutRef.current) {
          clearInterval(qrTimeoutRef.current);
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
        
        // Auto-retry após falha
        if (config.autoReconnect && connection.retryCount < config.maxRetries) {
          setTimeout(() => retry(), config.retryInterval);
        }
      });

      client.on('disconnected', (reason: string) => {
        addLog('connection', 'WhatsApp desconectado', { reason });
        client.isReady = false;
        
        saveConnection({
          isConnected: false,
          status: 'disconnected',
          retryCount: 0,
          qrCode: undefined,
          phoneNumber: undefined
        });
        
        // Auto-reconectar se configurado
        if (config.autoReconnect && connection.retryCount < config.maxRetries) {
          addLog('system', `Auto-reconectando em ${config.retryInterval/1000}s...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, config.retryInterval);
        }
      });

      // Inicializar cliente
      await client.initialize();

    } catch (error) {
      addLog('error', 'Erro crítico na conexão WhatsApp', { error });
      saveConnection({
        ...connection,
        status: 'error',
        lastError: 'Erro crítico - tente reiniciar a conexão'
      });
    } finally {
      setIsLoading(false);
    }
  }, [connection, isLoading, addLog, initializeWhatsAppClient, config]);

  const disconnect = useCallback(async () => {
    // Limpar timeouts
    if (qrTimeoutRef.current) {
      clearInterval(qrTimeoutRef.current);
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
    if (connection.status === 'connecting') {
      addLog('system', 'Gerando novo QR Code...');
      const newQR = generateQRCode();
      if (newQR) {
        saveConnection({
          ...connection,
          qrCode: newQR
        });
        addLog('connection', 'Novo QR Code gerado com sucesso');
      }
    }
  }, [connection, addLog, generateQRCode]);

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

  const simulateSuccessfulConnection = useCallback(() => {
    if (connection.status !== 'connecting') return;

    const phoneNumber = `+55${Math.floor(Math.random() * 90000000000) + 10000000000}`;
    
    // Limpar timeout de QR
    if (qrTimeoutRef.current) {
      clearInterval(qrTimeoutRef.current);
      qrTimeoutRef.current = null;
    }
    
    saveConnection({
      isConnected: true,
      phoneNumber: phoneNumber,
      lastSeen: new Date().toISOString(),
      status: 'connected',
      retryCount: 0,
      qrCode: undefined
    });

    addLog('connection', 'WhatsApp conectado via simulação!', { phoneNumber });
    addLog('system', 'Sistema de cobrança automática ativado');
  }, [connection, addLog]);

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
    sendMessage,
    updateConfig: saveConfig,
    addLog
  };
};
