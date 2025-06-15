
import { useState, useEffect } from 'react';
import { useFileSystemBackup } from './useFileSystemBackup';
import { useAuth } from './useAuth';
import { hybridDataManager } from '@/services/HybridDataManager';
import { LocalDataStructure, LocalClient, LocalDebt, CollectionMessage, UserSettings } from '@/services/LocalDataService';
import { ClientService } from '@/services/ClientService';
import { DebtService } from '@/services/DebtService';
import { StatisticsService } from '@/services/StatisticsService';

export const useLocalDataManager = () => {
  const { user } = useAuth();
  const { directoryHandle, isConnected } = useFileSystemBackup();
  const [database, setDatabase] = useState<LocalDataStructure | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalClients: 0,
    totalDebts: 0,
    pendingDebts: 0,
    overdueDebts: 0,
    paidDebts: 0,
    totalAmount: 0,
    overdueAmount: 0,
    messagesTotal: 0,
    messagesSent: 0
  });

  // Inicializar sistema quando usuário fizer login
  useEffect(() => {
    const initializeUserData = async () => {
      if (!user) {
        // Resetar dados quando usuário faz logout
        await hybridDataManager.resetUserAccess();
        setDatabase(null);
        setIsLoaded(false);
        setLoading(false);
        setStatistics({
          totalClients: 0,
          totalDebts: 0,
          pendingDebts: 0,
          overdueDebts: 0,
          paidDebts: 0,
          totalAmount: 0,
          overdueAmount: 0,
          messagesTotal: 0,
          messagesSent: 0
        });
        return;
      }

      try {
        console.log('🚀 Inicializando dados para usuário:', user.id);
        
        // Inicializar HybridDataManager para o usuário atual
        await hybridDataManager.initializeForUser(user.id, directoryHandle || undefined);
        
        // Carregar dados do usuário
        const userData = await hybridDataManager.loadUserData(user.id);
        setDatabase(userData);
        
        // Calcular estatísticas
        const stats = await StatisticsService.getStatistics(user.id);
        setStatistics(stats);
        
        console.log('✅ Dados do usuário carregados');
      } catch (error) {
        console.error('❌ Erro ao inicializar dados do usuário:', error);
        
        // Em caso de erro, tentar criar dados iniciais
        try {
          const initialData = {
            clients: [],
            debts: [],
            collectionHistory: [],
            settings: {
              automacaoAtiva: false,
              diasAntesLembrete: 3,
              diasAposVencimento: [1, 7, 15, 30],
              templatesPersonalizados: {},
              horarioEnvio: '09:00',
              updatedAt: new Date().toISOString()
            },
            metadata: {
              version: '1.0',
              lastModified: new Date().toISOString(),
              userId: user.id,
              backupCount: 0
            }
          };
          setDatabase(initialData);
          setStatistics({
            totalClients: 0,
            totalDebts: 0,
            pendingDebts: 0,
            overdueDebts: 0,
            paidDebts: 0,
            totalAmount: 0,
            overdueAmount: 0,
            messagesTotal: 0,
            messagesSent: 0
          });
        } catch (fallbackError) {
          console.error('❌ Erro ao criar dados iniciais:', fallbackError);
        }
      } finally {
        setIsLoaded(true);
        setLoading(false);
      }
    };

    initializeUserData();
  }, [user, directoryHandle, isConnected]);

  // Função para recarregar dados do usuário atual
  const reloadUserData = async () => {
    if (!user) return;

    try {
      const userData = await hybridDataManager.loadUserData(user.id);
      setDatabase(userData);
      
      // Atualizar estatísticas
      const stats = await StatisticsService.getStatistics(user.id);
      setStatistics(stats);
    } catch (error) {
      console.error('❌ Erro ao recarregar dados:', error);
    }
  };

  // Funções CRUD para Clientes usando ClientService
  const addClient = async (clientData: Omit<LocalClient, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return null;

    try {
      const newClient = await ClientService.addClient(user.id, clientData);
      await reloadUserData(); // Recarregar dados após mudança
      return newClient;
    } catch (error) {
      console.error('❌ Erro ao adicionar cliente:', error);
      throw error;
    }
  };

  const updateClient = async (id: string, updates: Partial<LocalClient>) => {
    if (!user) return;

    try {
      await ClientService.updateClient(user.id, id, updates);
      await reloadUserData();
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    if (!user) return;

    try {
      await ClientService.deleteClient(user.id, id);
      await reloadUserData();
    } catch (error) {
      console.error('❌ Erro ao deletar cliente:', error);
      throw error;
    }
  };

  // Funções CRUD para Dívidas usando DebtService
  const addDebt = async (debtData: Omit<LocalDebt, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return null;

    try {
      const newDebt = await DebtService.addDebt(user.id, debtData);
      await reloadUserData();
      return newDebt;
    } catch (error) {
      console.error('❌ Erro ao adicionar dívida:', error);
      throw error;
    }
  };

  const updateDebt = async (id: string, updates: Partial<LocalDebt>) => {
    if (!user) return;

    try {
      await DebtService.updateDebt(user.id, id, updates);
      await reloadUserData();
    } catch (error) {
      console.error('❌ Erro ao atualizar dívida:', error);
      throw error;
    }
  };

  const deleteDebt = async (id: string) => {
    if (!user) return;

    try {
      await DebtService.deleteDebt(user.id, id);
      await reloadUserData();
    } catch (error) {
      console.error('❌ Erro ao deletar dívida:', error);
      throw error;
    }
  };

  // Outras funções
  const addCollectionMessage = async (messageData: Omit<CollectionMessage, 'id'>) => {
    if (!user || !database) return null;

    try {
      const newMessage: CollectionMessage = {
        ...messageData,
        id: `${user.id}_msg_${Date.now()}`
      };

      const updatedDatabase = {
        ...database,
        collectionHistory: [...database.collectionHistory, newMessage],
        metadata: {
          ...database.metadata,
          lastModified: new Date().toISOString()
        }
      };

      await hybridDataManager.saveUserData(user.id, updatedDatabase);
      await reloadUserData();
      return newMessage;
    } catch (error) {
      console.error('❌ Erro ao adicionar mensagem:', error);
      throw error;
    }
  };

  const updateMessageStatus = async (id: string, status: CollectionMessage['statusEntrega'], erroDetalhes?: string) => {
    if (!user || !database) return;

    try {
      const updatedDatabase = {
        ...database,
        collectionHistory: database.collectionHistory.map(msg =>
          msg.id === id
            ? { ...msg, statusEntrega: status, erroDetalhes }
            : msg
        ),
        metadata: {
          ...database.metadata,
          lastModified: new Date().toISOString()
        }
      };

      await hybridDataManager.saveUserData(user.id, updatedDatabase);
      await reloadUserData();
    } catch (error) {
      console.error('❌ Erro ao atualizar status da mensagem:', error);
      throw error;
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user || !database) return;

    try {
      const updatedDatabase = {
        ...database,
        settings: {
          ...database.settings,
          ...newSettings,
          updatedAt: new Date().toISOString()
        },
        metadata: {
          ...database.metadata,
          lastModified: new Date().toISOString()
        }
      };

      await hybridDataManager.saveUserData(user.id, updatedDatabase);
      await reloadUserData();
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações:', error);
      throw error;
    }
  };

  const exportData = () => {
    return database ? JSON.stringify(database, null, 2) : '';
  };

  const importData = async (jsonData: string) => {
    if (!user) return false;

    try {
      const importedData = JSON.parse(jsonData);
      if (importedData.clients && Array.isArray(importedData.clients)) {
        const newData: LocalDataStructure = {
          ...importedData,
          metadata: {
            version: '1.0',
            lastModified: new Date().toISOString(),
            userId: user.id,
            backupCount: 0
          }
        };
        
        await hybridDataManager.saveUserData(user.id, newData);
        await reloadUserData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao importar dados:', error);
      return false;
    }
  };

  return {
    // Estado
    database,
    isLoaded,
    loading,
    statistics,

    // Clientes
    addClient,
    updateClient,
    deleteClient,

    // Dívidas
    addDebt,
    updateDebt,
    deleteDebt,

    // Histórico de Cobrança
    addCollectionMessage,
    updateMessageStatus,

    // Configurações
    updateSettings,

    // Import/Export
    exportData,
    importData,

    // Utilitários
    refresh: reloadUserData,
    
    // Info do usuário atual
    currentUserId: user?.id || null,
    isUserDataIsolated: hybridDataManager.isInitializedForUser(user?.id || '')
  };
};
