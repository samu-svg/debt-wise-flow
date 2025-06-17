
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useWhatsAppCredentials } from './useWhatsAppCredentials';
import type { WhatsAppConfig } from '@/types/whatsapp';

const DEFAULT_CONFIG: Partial<WhatsAppConfig> = {
  webhookUrl: '',
  messageDelay: 2000,
  autoReconnect: true,
  retryInterval: 30000,
  maxRetries: 3,
  businessHours: {
    enabled: false,
    start: '09:00',
    end: '18:00'
  }
};

interface UseWhatsAppConfigReturn {
  config: Partial<WhatsAppConfig>;
  isConfigDirty: boolean;
  updateConfig: (newConfig: Partial<WhatsAppConfig>) => void;
  saveConfig: () => Promise<boolean>;
  resetConfig: () => void;
}

export const useWhatsAppConfig = (): UseWhatsAppConfigReturn => {
  const { credentials, saveCredentials, loading } = useWhatsAppCredentials();
  const [config, setConfig] = useState<Partial<WhatsAppConfig>>(DEFAULT_CONFIG);
  const [isConfigDirty, setIsConfigDirty] = useState(false);

  // Carregar configuração das credenciais
  useEffect(() => {
    if (credentials && !loading) {
      setConfig({
        ...DEFAULT_CONFIG,
        accessToken: credentials.accessToken,
        phoneNumberId: credentials.phoneNumberId,
        businessAccountId: credentials.businessAccountId,
        webhookToken: credentials.webhookToken
      });
      setIsConfigDirty(false);
    }
  }, [credentials, loading]);

  const updateConfig = useCallback((newConfig: Partial<WhatsAppConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    setIsConfigDirty(true);
  }, []);

  const saveConfig = useCallback(async (): Promise<boolean> => {
    if (!config.accessToken || !config.phoneNumberId || !config.businessAccountId) {
      return false;
    }

    const success = await saveCredentials({
      accessToken: config.accessToken,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      webhookToken: config.webhookToken || 'whatsapp_webhook_token',
      isActive: false, // Will be set to true after successful connection test
      healthStatus: 'unknown'
    });

    if (success) {
      setIsConfigDirty(false);
    }

    return success;
  }, [config, saveCredentials]);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setIsConfigDirty(false);
  }, []);

  // Auto-save com debounce
  useEffect(() => {
    if (!isConfigDirty) return;

    const timeoutId = setTimeout(() => {
      if (config.accessToken && config.phoneNumberId && config.businessAccountId) {
        saveConfig();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [config, isConfigDirty, saveConfig]);

  return useMemo(() => ({
    config,
    isConfigDirty,
    updateConfig,
    saveConfig,
    resetConfig
  }), [config, isConfigDirty, updateConfig, saveConfig, resetConfig]);
};
