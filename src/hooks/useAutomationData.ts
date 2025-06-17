
import { useState, useEffect } from 'react';
import { useSupabaseData } from './useSupabaseData';
import { useAuth } from './useAuth';

export const useAutomationData = () => {
  const { user } = useAuth();
  const { clientes, dividas, mensagens, loading } = useSupabaseData();
  const [database, setDatabase] = useState<any>(null);

  useEffect(() => {
    if (!loading && user) {
      // Criar estrutura de dados similar ao formato local para compatibilidade
      setDatabase({
        clients: clientes.map(cliente => ({
          id: cliente.id,
          nome: cliente.nome,
          whatsapp: cliente.whatsapp,
          email: cliente.email,
          createdAt: cliente.created_at,
          updatedAt: cliente.updated_at
        })),
        debts: dividas.map(divida => ({
          id: divida.id,
          clientId: divida.cliente_id,
          valor: divida.valor,
          dataVencimento: divida.data_vencimento,
          status: divida.status,
          descricao: divida.descricao,
          createdAt: divida.created_at,
          updatedAt: divida.updated_at
        })),
        collectionHistory: mensagens.map(msg => ({
          id: msg.id,
          clientId: msg.cliente_id,
          debtId: msg.divida_id, // Direct access since this property exists in the Supabase schema
          data: msg.enviado_em,
          tipoMensagem: msg.tipo_mensagem,
          statusEntrega: msg.status_entrega,
          mensagem: msg.mensagem_enviada,
          templateUsado: msg.template_usado,
          erroDetalhes: msg.erro_detalhes
        })),
        settings: {
          automacaoAtiva: false,
          diasAntesLembrete: 3,
          diasAposVencimento: [1, 7, 15, 30],
          templatesPersonalizados: {},
          horarioEnvio: '09:00',
          updatedAt: new Date().toISOString()
        },
        metadata: {
          version: '3.0-supabase',
          lastModified: new Date().toISOString(),
          userId: user.id,
          backupCount: 0
        }
      });
    }
  }, [clientes, dividas, mensagens, loading, user]);

  const addCollectionMessage = async (messageData: any) => {
    console.log('addCollectionMessage called:', messageData);
    return null;
  };

  const updateSettings = async (newSettings: any) => {
    console.log('updateSettings called:', newSettings);
  };

  return {
    database,
    isLoaded: !loading,
    loading,
    addCollectionMessage,
    updateSettings
  };
};
