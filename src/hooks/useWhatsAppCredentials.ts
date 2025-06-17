
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface WhatsAppCredentials {
  id?: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookToken: string;
  isActive: boolean;
  lastHealthCheck?: string;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
}

export const useWhatsAppCredentials = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<WhatsAppCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCredentials = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_credentials')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCredentials({
          id: data.id,
          accessToken: data.access_token_encrypted || '',
          phoneNumberId: data.phone_number_id || '',
          businessAccountId: data.business_account_id || '',
          webhookToken: data.webhook_token || 'whatsapp_webhook_token',
          isActive: data.is_active || false,
          lastHealthCheck: data.last_health_check,
          healthStatus: data.health_status as 'healthy' | 'unhealthy' | 'unknown'
        });
      } else {
        setCredentials(null);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as credenciais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveCredentials = useCallback(async (newCredentials: Partial<WhatsAppCredentials>) => {
    if (!user) return false;

    setSaving(true);
    try {
      const credentialsData = {
        user_id: user.id,
        access_token_encrypted: newCredentials.accessToken,
        phone_number_id: newCredentials.phoneNumberId,
        business_account_id: newCredentials.businessAccountId,
        webhook_token: newCredentials.webhookToken || 'whatsapp_webhook_token',
        is_active: newCredentials.isActive || false,
        health_status: newCredentials.healthStatus || 'unknown'
      };

      const { data, error } = await supabase
        .from('whatsapp_credentials')
        .upsert(credentialsData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;

      setCredentials({
        id: data.id,
        accessToken: data.access_token_encrypted || '',
        phoneNumberId: data.phone_number_id || '',
        businessAccountId: data.business_account_id || '',
        webhookToken: data.webhook_token || '',
        isActive: data.is_active || false,
        lastHealthCheck: data.last_health_check,
        healthStatus: data.health_status as 'healthy' | 'unhealthy' | 'unknown'
      });

      return true;
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as credenciais",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [user]);

  const updateHealthStatus = useCallback(async (status: 'healthy' | 'unhealthy' | 'unknown') => {
    if (!user || !credentials?.id) return;

    try {
      const { error } = await supabase
        .from('whatsapp_credentials')
        .update({
          health_status: status,
          last_health_check: new Date().toISOString(),
          is_active: status === 'healthy'
        })
        .eq('id', credentials.id);

      if (error) throw error;

      setCredentials(prev => prev ? {
        ...prev,
        healthStatus: status,
        isActive: status === 'healthy',
        lastHealthCheck: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error('Error updating health status:', error);
    }
  }, [user, credentials?.id]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  return {
    credentials,
    loading,
    saving,
    saveCredentials,
    updateHealthStatus,
    reloadCredentials: loadCredentials
  };
};
