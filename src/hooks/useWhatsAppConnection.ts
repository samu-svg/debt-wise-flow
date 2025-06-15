
import { useState, useCallback, useMemo } from 'react';
import type { WhatsAppConnection } from '@/types/whatsapp';

const STORAGE_KEY_CONNECTION = 'whatsapp_cloud_connection';

interface UseWhatsAppConnectionReturn {
  connection: WhatsAppConnection;
  updateConnection: (newConnection: WhatsAppConnection) => void;
  resetConnection: () => void;
}

export const useWhatsAppConnection = (): UseWhatsAppConnectionReturn => {
  const [connection, setConnection] = useState<WhatsAppConnection>({
    isConnected: false,
    status: 'disconnected',
    retryCount: 0
  });

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

  // Carregar dados salvos na inicialização
  useState(() => {
    loadSavedConnection();
  });

  return useMemo(() => ({
    connection,
    updateConnection,
    resetConnection
  }), [connection, updateConnection, resetConnection]);
};
