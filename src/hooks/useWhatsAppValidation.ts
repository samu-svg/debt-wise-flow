
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseWhatsAppValidationReturn {
  isValidating: boolean;
  validateConfiguration: (config: any, addLog: (type: string, message: string, data?: any) => void) => Promise<boolean>;
  testConnection: (config: any, addLog: (type: string, message: string, data?: any) => void, updateConnection: (connection: any) => void, loadTemplates: () => void) => Promise<boolean>;
}

export const useWhatsAppValidation = (): UseWhatsAppValidationReturn => {
  const [isValidating, setIsValidating] = useState(false);

  const validateConfiguration = useCallback(async (config: any, addLog: (type: string, message: string, data?: any) => void): Promise<boolean> => {
    if (!config.accessToken || !config.phoneNumberId || !config.businessAccountId) {
      addLog('error', 'Configuração incompleta - Todos os campos são obrigatórios');
      return false;
    }

    setIsValidating(true);
    addLog('system', 'Validando configuração...');

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'validate_config',
          config
        }
      });

      if (error) {
        throw new Error(`Erro na validação: ${error.message}`);
      }

      if (data?.success && data.configValid) {
        addLog('system', 'Configuração validada com sucesso!', data);
        return true;
      } else {
        const errors = data?.errors || ['Configuração inválida'];
        addLog('error', `Configuração inválida: ${errors.join(', ')}`, data);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na validação';
      addLog('error', `Erro na validação: ${errorMessage}`, { error });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const testConnection = useCallback(async (
    config: any, 
    addLog: (type: string, message: string, data?: any) => void,
    updateConnection: (connection: any) => void,
    loadTemplates: () => void
  ): Promise<boolean> => {
    if (!config.accessToken || !config.phoneNumberId) {
      addLog('error', 'Configuração incompleta - Token de acesso e ID do número são obrigatórios');
      return false;
    }

    setIsValidating(true);
    addLog('system', 'Testando conexão com WhatsApp Cloud API...');

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'test_connection',
          config
        }
      });

      if (error) {
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        const newConnection = {
          isConnected: true,
          status: 'connected',
          phoneNumberId: config.phoneNumberId,
          phoneNumber: data.data?.phoneNumber,
          businessAccountId: config.businessAccountId,
          accessToken: config.accessToken,
          lastSeen: new Date().toISOString(),
          retryCount: 0
        };
        
        updateConnection(newConnection);
        addLog('connection', 'Conexão estabelecida com sucesso!', data.data);
        
        // Auto-carregar templates após conexão bem-sucedida
        setTimeout(() => loadTemplates(), 1000);
        
        return true;
      } else {
        throw new Error(data?.error || 'Erro na conexão');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na conexão';
      addLog('error', `Erro na conexão: ${errorMessage}`, { error });
      
      updateConnection({
        isConnected: false,
        status: 'error',
        lastError: errorMessage,
        retryCount: 0
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return useMemo(() => ({
    isValidating,
    validateConfiguration,
    testConnection
  }), [isValidating, validateConfiguration, testConnection]);
};
