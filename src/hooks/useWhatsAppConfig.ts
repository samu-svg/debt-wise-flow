
import { useState, useCallback, useRef, useEffect } from 'react';
import type { WhatsAppConfig } from '@/types/whatsapp';

const STORAGE_KEY = 'whatsapp_cloud_config';
const DEBOUNCE_DELAY = 1000; // 1 segundo

const DEFAULT_CONFIG: Partial<WhatsAppConfig> = {
  messageDelay: 2000,
  autoReconnect: true,
  retryInterval: 15000,
  maxRetries: 5,
  businessHours: {
    enabled: false,
    start: '09:00',
    end: '18:00'
  }
} as const;

export const useWhatsAppConfig = () => {
  const [config, setConfig] = useState<Partial<WhatsAppConfig>>(DEFAULT_CONFIG);
  const [isConfigDirty, setIsConfigDirty] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar configuração salva
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig) as Partial<WhatsAppConfig>;
        setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  }, []);

  // Função de salvamento com debounce
  const saveConfigDebounced = useCallback((newConfig: Partial<WhatsAppConfig>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsConfigDirty(true);

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
        setIsConfigDirty(false);
        console.log('Configuração salva automaticamente');
      } catch (error) {
        console.error('Erro ao salvar configuração:', error);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<WhatsAppConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    saveConfigDebounced(updatedConfig);
  }, [config, saveConfigDebounced]);

  // Limpeza do timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    config,
    updateConfig,
    isConfigDirty
  };
};
