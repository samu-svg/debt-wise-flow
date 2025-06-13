
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ClienteCobranca {
  id: string;
  nome: string;
  whatsapp: string;
  valor_divida: number;
  data_vencimento: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MensagemCobranca {
  id: string;
  cliente_id: string;
  tipo_mensagem: string;
  template_usado: string;
  mensagem_enviada: string;
  status_entrega: string;
  whatsapp_message_id?: string;
  erro_detalhes?: string;
  enviado_em: string;
}

export interface TemplateCobranca {
  id: string;
  nome: string;
  tipo: string;
  template: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useCobrancaAutomatica = () => {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<ClienteCobranca[]>([]);
  const [mensagens, setMensagens] = useState<MensagemCobranca[]>([]);
  const [templates, setTemplates] = useState<TemplateCobranca[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadClientes();
      loadMensagens();
      loadTemplates();
    }
  }, [user]);

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes_cobranca')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadMensagens = async () => {
    try {
      const { data, error } = await supabase
        .from('mensagens_cobranca')
        .select(`
          *,
          clientes_cobranca (
            nome,
            whatsapp
          )
        `)
        .order('enviado_em', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMensagens(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates_cobranca')
        .select('*')
        .order('tipo');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const adicionarCliente = async (cliente: Omit<ClienteCobranca, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes_cobranca')
        .insert([{
          ...cliente,
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      await loadClientes();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarCliente = async (id: string, updates: Partial<ClienteCobranca>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('clientes_cobranca')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadClientes();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removerCliente = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('clientes_cobranca')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadClientes();
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarTemplate = async (id: string, updates: Partial<TemplateCobranca>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('templates_cobranca')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadTemplates();
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const executarCobrancaManual = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('cobranca-automatica');
      
      if (error) throw error;
      
      await loadMensagens();
      return data;
    } catch (error) {
      console.error('Erro ao executar cobrança:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas
  const estatisticas = {
    totalClientes: clientes.length,
    clientesPendentes: clientes.filter(c => c.status === 'pendente').length,
    clientesEmAtraso: clientes.filter(c => {
      const hoje = new Date();
      const vencimento = new Date(c.data_vencimento);
      return vencimento < hoje && c.status === 'pendente';
    }).length,
    valorTotal: clientes.reduce((total, c) => total + c.valor_divida, 0),
    mensagensEnviadas: mensagens.filter(m => m.status_entrega === 'enviado').length,
    mensagensComErro: mensagens.filter(m => m.status_entrega === 'erro').length,
  };

  return {
    clientes,
    mensagens,
    templates,
    loading,
    estatisticas,
    adicionarCliente,
    atualizarCliente,
    removerCliente,
    atualizarTemplate,
    executarCobrancaManual,
    recarregarDados: () => {
      loadClientes();
      loadMensagens();
      loadTemplates();
    }
  };
};
