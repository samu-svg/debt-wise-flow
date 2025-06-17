
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppCredentials {
  id?: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookToken: string;
  isActive: boolean;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck?: string;
}

interface UseWhatsAppCredentialsReturn {
  credentials: Partial<WhatsAppCredentials>;
  isLoading: boolean;
  isConfigDirty: boolean;
  saveCredentials: (creds: Partial<WhatsAppCredentials>) => Promise<boolean>;
  loadCredentials: () => Promise<void>;
  updateHealthStatus: (status: 'healthy' | 'unhealthy', lastCheck?: string) => Promise<void>;
}

export const useWhatsAppCredentials = (): UseWhatsAppCredentialsReturn => {
  const [credentials, setCredentials] = useState<Partial<WhatsAppCredentials>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigDirty, setIsConfigDirty] = useState(false);

  const loadCredentials = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('whatsapp_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar credenciais:', error);
        return;
      }

      if (data) {
        setCredentials({
          id: data.id,
          accessToken: data.access_token_encrypted || '',
          phoneNumberId: data.phone_number_id || '',
          businessAccountId: data.business_account_id || '',
          webhookToken: data.webhook_token || 'whatsapp_webhook_token',
          isActive: data.is_active,
          healthStatus: data.health_status as 'healthy' | 'unhealthy' | 'unknown',
          lastHealthCheck: data.last_health_check
        });
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCredentials = useCallback(async (creds: Partial<WhatsAppCredentials>): Promise<boolean> => {
    setIsConfigDirty(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Desativar credenciais anteriores
      await supabase
        .from('whatsapp_credentials')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Criar nova credencial ativa
      const { error } = await supabase
        .from('whatsapp_credentials')
        .insert({
          user_id: user.id,
          access_token_encrypted: creds.accessToken,
          phone_number_id: creds.phoneNumberId,
          business_account_id: creds.businessAccountId,
          webhook_token: creds.webhookToken || 'whatsapp_webhook_token',
          is_active: true,
          health_status: 'unknown'
        });

      if (error) {
        console.error('Erro ao salvar credenciais:', error);
        return false;
      }

      setCredentials(prev => ({ ...prev, ...creds }));
      setIsConfigDirty(false);
      return true;
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      return false;
    }
  }, []);

  const updateHealthStatus = useCallback(async (status: 'healthy' | 'unhealthy', lastCheck?: string) => {
    if (!credentials.id) return;

    try {
      const { error } = await supabase
        .from('whatsapp_credentials')
        .update({
          health_status: status,
          last_health_check: lastCheck || new Date().toISOString()
        })
        .eq('id', credentials.id);

      if (error) {
        console.error('Erro ao atualizar status de saúde:', error);
        return;
      }

      setCredentials(prev => ({
        ...prev,
        healthStatus: status,
        lastHealthCheck: lastCheck || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao atualizar status de saúde:', error);
    }
  }, [credentials.id]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  return useMemo(() => ({
    credentials,
    isLoading,
    isConfigDirty,
    saveCredentials,
    loadCredentials,
    updateHealthStatus
  }), [credentials, isLoading, isConfigDirty, saveCredentials, loadCredentials, updateHealthStatus]);
};
