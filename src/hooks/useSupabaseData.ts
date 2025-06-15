
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Cliente {
  id: string;
  nome: string;
  whatsapp: string;
  email?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Divida {
  id: string;
  cliente_id: string;
  descricao: string;
  valor: number;
  data_vencimento?: string;
  status: 'pendente' | 'pago' | 'atrasado';
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Mensagem {
  id: string;
  cliente_id: string;
  user_id: string;
  tipo_mensagem: string;
  template_usado: string;
  mensagem_enviada: string;
  status_entrega?: string;
  whatsapp_message_id?: string;
  erro_detalhes?: string;
  enviado_em?: string;
}

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('clientes_cobranca')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const clientesFormatted: Cliente[] = data.map(item => ({
        id: item.id,
        nome: item.nome,
        whatsapp: item.whatsapp,
        email: item.email || undefined,
        user_id: item.user_id,
        created_at: item.created_at || '',
        updated_at: item.updated_at || undefined
      }));

      setClientes(clientesFormatted);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive",
      });
    }
  };

  const fetchDividas = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('clientes_cobranca')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const dividasFormatted: Divida[] = data.map(item => ({
        id: item.id,
        cliente_id: item.id, // usando o mesmo ID pois a estrutura atual trata cada linha como uma dívida
        descricao: `Dívida de ${item.nome}`,
        valor: item.valor_divida,
        data_vencimento: item.data_vencimento,
        status: item.status as 'pendente' | 'pago' | 'atrasado',
        user_id: item.user_id,
        created_at: item.created_at || '',
        updated_at: item.updated_at || undefined
      }));

      setDividas(dividasFormatted);
    } catch (error) {
      console.error('Erro ao buscar dívidas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as dívidas",
        variant: "destructive",
      });
    }
  };

  const fetchMensagens = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mensagens_cobranca')
        .select('*')
        .eq('user_id', user.id)
        .order('enviado_em', { ascending: false });

      if (error) throw error;
      setMensagens(data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens",
        variant: "destructive",
      });
    }
  };

  const addCliente = async (clienteData: Omit<Cliente, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clientes_cobranca')
        .insert({
          nome: clienteData.nome,
          whatsapp: clienteData.whatsapp,
          email: clienteData.email,
          user_id: user.id,
          valor_divida: 0,
          data_vencimento: new Date().toISOString().split('T')[0],
          status: 'pendente'
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchClientes();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cliente",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addDivida = async (dividaData: {
    clientId: string;
    valor: number;
    dataVencimento?: string;
    status: 'pendente' | 'pago' | 'atrasado';
    descricao: string;
  }) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      // Buscar o cliente para obter informações necessárias
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes_cobranca')
        .select('*')
        .eq('id', dividaData.clientId)
        .eq('user_id', user.id)
        .single();

      if (clienteError || !cliente) {
        throw new Error('Cliente não encontrado');
      }

      // Atualizar o registro existente do cliente com a nova dívida
      const { error } = await supabase
        .from('clientes_cobranca')
        .update({
          valor_divida: dividaData.valor,
          data_vencimento: dividaData.dataVencimento || new Date().toISOString().split('T')[0],
          status: dividaData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', dividaData.clientId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchDividas();
      await fetchClientes();
    } catch (error) {
      console.error('Erro ao adicionar dívida:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a dívida",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCliente = async (id: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('clientes_cobranca')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchClientes();
      await fetchDividas();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        fetchClientes(),
        fetchDividas(),
        fetchMensagens()
      ]).finally(() => {
        setLoading(false);
      });
    } else {
      setClientes([]);
      setDividas([]);
      setMensagens([]);
      setLoading(false);
    }
  }, [user]);

  const getStatistics = () => {
    const totalClients = clientes.length;
    const totalDebts = dividas.length;
    const pendingDebts = dividas.filter(d => d.status === 'pendente').length;
    const overdueDebts = dividas.filter(d => d.status === 'atrasado').length;
    const paidDebts = dividas.filter(d => d.status === 'pago').length;
    const totalAmount = dividas.filter(d => d.status !== 'pago').reduce((sum, debt) => sum + debt.valor, 0);
    const overdueAmount = dividas.filter(d => d.status === 'atrasado').reduce((sum, debt) => sum + debt.valor, 0);
    const messagesSent = mensagens.length;
    const messagesTotal = totalDebts; // Assumindo 1 mensagem por dívida como base

    return {
      totalClients,
      totalDebts,
      pendingDebts,
      overdueDebts,
      paidDebts,
      totalAmount,
      overdueAmount,
      messagesSent,
      messagesTotal
    };
  };

  return {
    clientes,
    dividas,
    mensagens,
    loading,
    addCliente,
    addDivida,
    deleteCliente,
    getStatistics,
    refetch: () => {
      if (user) {
        fetchClientes();
        fetchDividas();
        fetchMensagens();
      }
    }
  };
};
