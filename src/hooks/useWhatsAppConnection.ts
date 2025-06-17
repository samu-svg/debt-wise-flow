
import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWhatsAppCredentials } from './useWhatsAppCredentials';
import type { WhatsAppConnection } from '@/types/whatsapp';

interface UseWhatsAppConnectionReturn {
  connection: WhatsAppConnection;
  updateConnection: (newConnection: WhatsAppConnection) => void;
  resetConnection: () => void;
  testConnection: () => Promise<boolean>;
  isLoading: boolean;
}

export const useWhatsAppConnection = (): UseWhatsAppConnectionReturn => {
  const { user } = useAuth();
  const { credentials, updateHealthStatus } = useWhatsAppCredentials();
  const [connection, setConnection] = useState<WhatsAppConnection>({
    isConnected: false,
    status: 'disconnected',
    retryCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Atualizar conexão baseado nas credenciais
  useEffect(() => {
    if (credentials) {
      setConnection(prev => ({
        ...prev,
        isConnected: credentials.isActive,
        phoneNumberId: credentials.phoneNumberId,
        businessAccountId: credentials.businessAccountId,
        accessToken: credentials.accessToken,
        status: credentials.isActive ? 'connected' : 'disconnected',
        lastSeen: credentials.lastHealthCheck
      }));
    }
  }, [credentials]);

  const updateConnection = useCallback((newConnection: WhatsAppConnection): void => {
    setConnection(newConnection);
  }, []);

  const resetConnection = useCallback((): void => {
    const disconnectedConnection: WhatsAppConnection = {
      isConnected: false,
      status: 'disconnected',
      retryCount: 0
    };
    setConnection(disconnectedConnection);
    updateHealthStatus('unknown');
  }, [updateHealthStatus]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!user || !credentials) return false;

    setIsLoading(true);
    try {
      const config = {
        accessToken: credentials.accessToken,
        phoneNumberId: credentials.phoneNumberId,
        businessAccountId: credentials.businessAccountId
      };

      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'test_connection',
          config,
          userId: user.id
        }
      });

      if (error) {
        throw new Error(`Erro na função: ${error.message}`);
      }

      const success = data?.success || false;
      
      if (success) {
        setConnection(prev => ({
          ...prev,
          isConnected: true,
          status: 'connected',
          phoneNumber: data.phoneNumber,
          lastSeen: new Date().toISOString(),
          retryCount: 0,
          lastError: undefined
        }));
        
        await updateHealthStatus('healthy');
      } else {
        setConnection(prev => ({
          ...prev,
          isConnected: false,
          status: 'error',
          retryCount: prev.retryCount + 1,
          lastError: data?.error || 'Erro desconhecido'
        }));
        
        await updateHealthStatus('unhealthy');
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setConnection(prev => ({
        ...prev,
        isConnected: false,
        status: 'error',
        retryCount: prev.retryCount + 1,
        lastError: errorMessage
      }));
      
      await updateHealthStatus('unhealthy');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, credentials, updateHealthStatus]);

  return useMemo(() => ({
    connection,
    updateConnection,
    resetConnection,
    testConnection,
    isLoading
  }), [connection, updateConnection, resetConnection, testConnection, isLoading]);
};
