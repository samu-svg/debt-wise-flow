
import { useState, useEffect } from 'react';
import { useSupabaseData } from './useSupabaseData';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const useDataManager = () => {
  const { user } = useAuth();
  const {
    clientes,
    dividas,
    mensagens,
    loading,
    addCliente,
    addDivida,
    deleteCliente,
    getStatistics,
    refetch
  } = useSupabaseData();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsLoaded(true);
    }
  }, [loading]);

  const statistics = getStatistics();

  // Funções simplificadas que mapeiam para o useSupabaseData
  const addClient = async (clientData: { nome: string; whatsapp: string; email?: string }) => {
    try {
      const result = await addCliente(clientData);
      toast({
        title: "Cliente adicionado",
        description: `${clientData.nome} foi adicionado com sucesso!`,
      });
      return result;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      throw error;
    }
  };

  const addDebt = async (debtData: {
    clientId: string;
    valor: number;
    dataVencimento?: string;
    status: 'pendente' | 'pago' | 'atrasado';
    descricao: string;
  }) => {
    try {
      const result = await addDivida(debtData);
      toast({
        title: "Dívida adicionada",
        description: "Dívida foi adicionada com sucesso!",
      });
      return result;
    } catch (error) {
      console.error('Erro ao adicionar dívida:', error);
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await deleteCliente(id);
      toast({
        title: "Cliente removido",
        description: "Cliente foi removido com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  };

  const exportData = () => {
    const data = {
      clientes,
      dividas,
      mensagens,
      exportDate: new Date().toISOString(),
      version: '3.0-supabase'
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.clientes && Array.isArray(data.clientes)) {
        // Implementar lógica de importação se necessário
        console.log('Importação de dados não implementada ainda');
        toast({
          title: "Importação",
          description: "Funcionalidade de importação será implementada em breve",
          variant: "destructive",
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar os dados",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    // Estado
    clients: clientes,
    debts: dividas,
    messages: mensagens,
    isLoaded,
    loading,
    statistics,

    // Funções CRUD
    addClient,
    addDebt,
    deleteClient,

    // Import/Export
    exportData,
    importData,

    // Utilitários
    refresh: refetch,
    
    // Info do usuário atual
    currentUserId: user?.id || null,
    isUserDataIsolated: Boolean(user)
  };
};
