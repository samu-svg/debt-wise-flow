
import { useState, useCallback, useMemo } from 'react';
import type { WhatsAppConnection } from '@/types/whatsapp';

const STORAGE_KEY_CONNECTION = 'whatsapp_cloud_connection';

interface UseWhatsAppConnectionReturn {
  connection: WhatsAppConnection;
  updateConnection: (newConnection: WhatsAppConnection) => void;
  resetConnection: () => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  retry: () => Promise<void>;
  generateNewQR: () => Promise<void>;
  isLoading: boolean;
}

export const useWhatsAppConnection = (): UseWhatsAppConnectionReturn => {
  const [connection, setConnection] = useState<WhatsAppConnection>({
    isConnected: false,
    status: 'disconnected',
    retryCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Carregar conexão salva
  const loadSavedConnection = useCallback(() => {
    try {
      const savedConnection = localStorage.getItem(STORAGE_KEY_CONNECTION);
      if (savedConnection) {
        const parsedConnection = JSON.parse(savedConnection) as WhatsAppConnection;
        setConnection(parsedConnection);
      }
    } catch (error) {
      console.error('Erro ao carregar conexão:', error);
    }
  }, []);

  // Salvar conexão
  const saveConnection = useCallback((newConnection: WhatsAppConnection): void => {
    try {
      localStorage.setItem(STORAGE_KEY_CONNECTION, JSON.stringify(newConnection));
      setConnection(newConnection);
    } catch (error) {
      console.error('Erro ao salvar conexão:', error);
    }
  }, []);

  const updateConnection = useCallback((newConnection: WhatsAppConnection): void => {
    saveConnection(newConnection);
  }, [saveConnection]);

  const resetConnection = useCallback((): void => {
    const disconnectedConnection: WhatsAppConnection = {
      isConnected: false,
      status: 'disconnected',
      retryCount: 0
    };
    saveConnection(disconnectedConnection);
  }, [saveConnection]);

  const connect = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const connectingConnection: WhatsAppConnection = {
        isConnected: false,
        status: 'connecting',
        retryCount: 0
      };
      saveConnection(connectingConnection);
      // Lógica de conexão seria implementada aqui
      console.log('Tentando conectar...');
    } catch (error) {
      console.error('Erro ao conectar:', error);
      const errorConnection: WhatsAppConnection = {
        isConnected: false,
        status: 'error',
        retryCount: connection.retryCount + 1,
        lastError: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      saveConnection(errorConnection);
    } finally {
      setIsLoading(false);
    }
  }, [connection.retryCount, saveConnection]);

  const disconnect = useCallback((): void => {
    resetConnection();
  }, [resetConnection]);

  const retry = useCallback(async (): Promise<void> => {
    await connect();
  }, [connect]);

  const generateNewQR = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Lógica para gerar novo QR seria implementada aqui
      console.log('Gerando novo QR...');
    } catch (error) {
      console.error('Erro ao gerar QR:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar dados salvos na inicialização
  useState(() => {
    loadSavedConnection();
  });

  return useMemo(() => ({
    connection,
    updateConnection,
    resetConnection,
    connect,
    disconnect,
    retry,
    generateNewQR,
    isLoading
  }), [connection, updateConnection, resetConnection, connect, disconnect, retry, generateNewQR, isLoading]);
};
