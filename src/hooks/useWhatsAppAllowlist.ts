
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AllowlistEntry {
  id: string;
  phoneNumber: string;
  name?: string;
  isActive: boolean;
  addedAt: string;
}

interface UseWhatsAppAllowlistReturn {
  allowlist: AllowlistEntry[];
  isLoading: boolean;
  addNumber: (phoneNumber: string, name?: string) => Promise<boolean>;
  removeNumber: (id: string) => Promise<boolean>;
  toggleNumber: (id: string, isActive: boolean) => Promise<boolean>;
  isNumberAllowed: (phoneNumber: string) => boolean;
  loadAllowlist: () => Promise<void>;
}

export const useWhatsAppAllowlist = (): UseWhatsAppAllowlistReturn => {
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAllowlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Usar query SQL direta para acessar a nova tabela
      const { data, error } = await supabase
        .from('whatsapp_allowlist' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar allowlist:', error);
        return;
      }

      const formattedList: AllowlistEntry[] = (data || []).map((item: any) => ({
        id: item.id,
        phoneNumber: item.phone_number,
        name: item.name,
        isActive: item.is_active,
        addedAt: item.added_at
      }));

      setAllowlist(formattedList);
    } catch (error) {
      console.error('Erro ao carregar allowlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addNumber = useCallback(async (phoneNumber: string, name?: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Formatar número (remover caracteres especiais)
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('whatsapp_allowlist' as any)
        .insert({
          user_id: user.id,
          phone_number: cleanPhone,
          name: name || null,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar número à allowlist:', error);
        return false;
      }

      if (data) {
        const newEntry: AllowlistEntry = {
          id: data.id,
          phoneNumber: data.phone_number,
          name: data.name,
          isActive: data.is_active,
          addedAt: data.added_at
        };

        setAllowlist(prev => [newEntry, ...prev]);
      }
      return true;
    } catch (error) {
      console.error('Erro ao adicionar número à allowlist:', error);
      return false;
    }
  }, []);

  const removeNumber = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('whatsapp_allowlist' as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover número da allowlist:', error);
        return false;
      }

      setAllowlist(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (error) {
      console.error('Erro ao remover número da allowlist:', error);
      return false;
    }
  }, []);

  const toggleNumber = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('whatsapp_allowlist' as any)
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status do número:', error);
        return false;
      }

      setAllowlist(prev => prev.map(item => 
        item.id === id ? { ...item, isActive } : item
      ));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do número:', error);
      return false;
    }
  }, []);

  const isNumberAllowed = useCallback((phoneNumber: string): boolean => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return allowlist.some(item => 
      item.isActive && item.phoneNumber === cleanPhone
    );
  }, [allowlist]);

  useEffect(() => {
    loadAllowlist();
  }, [loadAllowlist]);

  return useMemo(() => ({
    allowlist,
    isLoading,
    addNumber,
    removeNumber,
    toggleNumber,
    isNumberAllowed,
    loadAllowlist
  }), [allowlist, isLoading, addNumber, removeNumber, toggleNumber, isNumberAllowed, loadAllowlist]);
};
