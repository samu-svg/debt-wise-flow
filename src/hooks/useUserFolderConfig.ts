
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface FolderConfig {
  id: string;
  folder_name: string;
  folder_handle_data?: any;
  configured_at: string;
  updated_at: string;
}

export const useUserFolderConfig = () => {
  const { user } = useAuth();
  const [folderConfig, setFolderConfig] = useState<FolderConfig | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadFolderConfig();
    }
  }, [user?.id]);

  const loadFolderConfig = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_folder_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Não é erro "não encontrado"
        throw error;
      }

      setFolderConfig(data);
    } catch (error) {
      console.error('Erro ao carregar configuração da pasta:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFolderConfig = async (folderName: string, handleData?: any) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);

      const configData = {
        user_id: user.id,
        folder_name: folderName,
        folder_handle_data: handleData
      };

      const { data, error } = await supabase
        .from('user_folder_configs')
        .upsert(configData)
        .select()
        .single();

      if (error) throw error;

      setFolderConfig(data);
      
      toast({
        title: "Configuração salva",
        description: `Pasta "${folderName}" configurada com sucesso!`,
      });

      return data;
    } catch (error) {
      console.error('Erro ao salvar configuração da pasta:', error);
      toast({
        title: "Erro ao salvar configuração",
        description: "Não foi possível salvar a configuração da pasta.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteFolderConfig = async () => {
    if (!user?.id || !folderConfig?.id) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_folder_configs')
        .delete()
        .eq('id', folderConfig.id);

      if (error) throw error;

      setFolderConfig(null);
      
      toast({
        title: "Configuração removida",
        description: "Configuração da pasta foi removida com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao remover configuração da pasta:', error);
      toast({
        title: "Erro ao remover configuração",
        description: "Não foi possível remover a configuração da pasta.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    folderConfig,
    loading,
    saveFolderConfig,
    deleteFolderConfig,
    reload: loadFolderConfig,
    isConfigured: !!folderConfig
  };
};
