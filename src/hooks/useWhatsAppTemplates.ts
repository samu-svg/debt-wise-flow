
import { useState, useCallback, useMemo } from 'react';
import type { WhatsAppTemplate } from '@/types/whatsapp';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY_TEMPLATES = 'whatsapp_cloud_templates';

interface UseWhatsAppTemplatesReturn {
  templates: WhatsAppTemplate[];
  isLoading: boolean;
  loadTemplates: (config: any, addLog: (type: string, message: string, data?: any) => void) => Promise<void>;
  clearTemplates: () => void;
}

export const useWhatsAppTemplates = (): UseWhatsAppTemplatesReturn => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar templates salvos
  const loadSavedTemplates = useCallback(() => {
    try {
      const savedTemplates = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates) as WhatsAppTemplate[];
        setTemplates(parsedTemplates);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  }, []);

  // Salvar templates
  const saveTemplates = useCallback((newTemplates: WhatsAppTemplate[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Erro ao salvar templates:', error);
    }
  }, []);

  const loadTemplates = useCallback(async (config: any, addLog: (type: string, message: string, data?: any) => void): Promise<void> => {
    if (!config.accessToken || !config.businessAccountId) {
      addLog('error', 'Configuração incompleta para carregar templates');
      return;
    }

    setIsLoading(true);
    addLog('system', 'Carregando templates...');
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'get_templates',
          config
        }
      });

      if (error) {
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        const loadedTemplates = data.templates || [];
        saveTemplates(loadedTemplates);
        addLog('system', `${loadedTemplates.length} templates carregados (${data.approved || 0} aprovados)`);
      } else {
        throw new Error(data?.error || 'Erro ao carregar templates');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar templates';
      addLog('error', `Erro ao carregar templates: ${errorMessage}`, { error });
    } finally {
      setIsLoading(false);
    }
  }, [saveTemplates]);

  const clearTemplates = useCallback((): void => {
    setTemplates([]);
    localStorage.removeItem(STORAGE_KEY_TEMPLATES);
  }, []);

  // Carregar templates salvos na inicialização
  useState(() => {
    loadSavedTemplates();
  });

  return useMemo(() => ({
    templates,
    isLoading,
    loadTemplates,
    clearTemplates
  }), [templates, isLoading, loadTemplates, clearTemplates]);
};
