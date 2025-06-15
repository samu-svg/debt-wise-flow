
import { useState, useEffect } from 'react';
import { useFileSystemBackup } from './useFileSystemBackup';
import { useAuth } from './useAuth';
import { localDataService, LocalDataStructure, LocalClient, LocalDebt, CollectionMessage, UserSettings } from '@/services/LocalDataService';

const STORAGE_KEY = 'debt_manager_local_data';

export const useLocalDataManager = () => {
  const { user } = useAuth();
  const { directoryHandle, isConnected, isSupported } = useFileSystemBackup();
  const [database, setDatabase] = useState<LocalDataStructure | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inicializar sistema quando conectado
  useEffect(() => {
    const initializeLocalData = async () => {
      if (!user || !directoryHandle || !isConnected) {
        setLoading(false);
        return;
      }

      try {
        console.log('🚀 Inicializando sistema de dados locais...');
        
        // Inicializar serviço de dados locais
        await localDataService.initialize(directoryHandle, user.id);
        
        // Carregar dados existentes ou criar estrutura inicial
        const data = await localDataService.loadData();
        setDatabase(data);
        
        // Sync com localStorage se necessário
        await syncWithLocalStorage(data);
        
        console.log('✅ Sistema de dados locais inicializado');
      } catch (error) {
        console.error('❌ Erro ao inicializar dados locais:', error);
        // Fallback para localStorage
        await loadFromLocalStorage();
      } finally {
        setIsLoaded(true);
        setLoading(false);
      }
    };

    initializeLocalData();
  }, [user, directoryHandle, isConnected]);

  const syncWithLocalStorage = async (localData: LocalDataStructure | null) => {
    try {
      const localStorageData = localStorage.getItem(STORAGE_KEY);
      
      if (localStorageData && (!localData || localData.clients.length === 0)) {
        console.log('🔄 Migrando dados do localStorage para sistema local...');
        const parsedData = JSON.parse(localStorageData);
        
        const migratedData: LocalDataStructure = {
          clients: parsedData.clients || [],
          debts: parsedData.debts || [],
          collectionHistory: parsedData.collectionHistory || [],
          settings: parsedData.settings || localData?.settings || {
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
            userId: user!.id,
            backupCount: 0
          }
        };
        
        await localDataService.saveData(migratedData);
        setDatabase(migratedData);
        
        // Limpar localStorage após migração
        localStorage.removeItem(STORAGE_KEY);
        console.log('✅ Migração concluída');
      }
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    }
  };

  const loadFromLocalStorage = async () => {
    try {
      console.log('📱 Carregando dados do localStorage (fallback)...');
      const saved = localStorage.getItem(STORAGE_KEY);
      
      if (saved) {
        const parsedData = JSON.parse(saved);
        const fallbackData: LocalDataStructure = {
          clients: parsedData.clients || [],
          debts: parsedData.debts || [],
          collectionHistory: parsedData.collectionHistory || [],
          settings: parsedData.settings || {
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
            userId: user?.id || 'unknown',
            backupCount: 0
          }
        };
        setDatabase(fallbackData);
      } else {
        // Criar dados iniciais
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
            userId: user?.id || 'unknown',
            backupCount: 0
          }
        };
        setDatabase(initialData);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar do localStorage:', error);
    }
  };

  const saveData = async (newDatabase: LocalDataStructure) => {
    try {
      console.log('💾 Salvando dados...');
      
      if (isConnected && directoryHandle && user) {
        // Salvar no sistema de arquivos local
        await localDataService.saveData(newDatabase);
        console.log('✅ Dados salvos no sistema local');
      } else {
        // Fallback para localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDatabase));
        console.log('💾 Dados salvos no localStorage (fallback)');
      }
      
      setDatabase(newDatabase);
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      // Sempre tentar salvar no localStorage como último recurso
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDatabase));
      setDatabase(newDatabase);
    }
  };

  // Funções CRUD para Clientes
  const addClient = async (clientData: Omit<LocalClient, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!database) return null;

    const newClient: LocalClient = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedDatabase = {
      ...database,
      clients: [...database.clients, newClient],
      metadata: {
        ...database.metadata,
        lastModified: new Date().toISOString()
      }
    };

    await saveData(updatedDatabase);
    return newClient;
  };

  const updateClient = async (id: string, updates: Partial<LocalClient>) => {
    if (!database) return;

    const updatedDatabase = {
      ...database,
      clients: database.clients.map(client =>
        client.id === id
          ? { ...client, ...updates, updatedAt: new Date().toISOString() }
          : client
      ),
      metadata: {
        ...database.metadata,
        lastModified: new Date().toISOString()
      }
    };

    await saveData(updatedDatabase);
  };

  const deleteClient = async (id: string) => {
    if (!database) return;

    const updatedDatabase = {
      ...database,
      clients: database.clients.filter(client => client.id !== id),
      debts: database.debts.filter(debt => debt.clientId !== id),
      collectionHistory: database.collectionHistory.filter(msg => msg.clientId !== id),
      metadata: {
        ...database.metadata,
        lastModified: new Date().toISOString()
      }
    };

    await saveData(updatedDatabase);
  };

  // Funções CRUD para Dívidas
  const addDebt = async (debtData: Omit<LocalDebt, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!database) return null;

    const newDebt: LocalDebt = {
      ...debtData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedDatabase = {
      ...database,
      debts: [...database.debts, newDebt],
      metadata: {
        ...database.metadata,
        lastModified: new Date().toISOString()
      }
    };

    await saveData(updatedDatabase);
    return newDebt;
  };

  const updateDebt = async (id: string, updates: Partial<LocalDebt>) => {
    if (!database) return;

    const updatedDatabase = {
      ...database,
      debts: database.debts.map(debt =>
        debt.id === id
          ? { ...debt, ...updates, updatedAt: new Date().toISOString() }
          : debt
      ),
      metadata: {
        ...database.metadata,
        lastModified: new Date().toISOString()
      }
    };

    await saveData(updatedDatabase);
  };

  const deleteDebt = async (id: string) => {
    if (!database) return;

    const updatedDatabase = {
      ...database,
      debts: database.debts.filter(debt => debt.id !== id),
      collectionHistory: database.collectionHistory.filter(msg => msg.debtId !== id),
      metadata: {
        ...database.metadata,
        lastModified: new Date().toISOString()
      }
    };

    await saveData(updatedDatabase);
  };

  // Outras funções
  const addCollectionMessage = async (messageData: Omit<CollectionMessage, 'id'>) => {
    if (!database) return null;

    const newMessage: CollectionMessage = {
      ...messageData,
      id: Date.now().toString()
    };

    const updatedDatabase = {
      ...database,
      collectionHistory: [...database.collectionHistory, newMessage],
      metadata: {
        ...database.metadata,
        lastModified: new Date().toISOString()
      }
    };

    await saveData(updatedDatabase);
    return newMessage;
  };

  const updateMessageStatus = async (id: string, status: CollectionMessage['statusEntrega'], erroDetalhes?: string) => {
    if (!database) return;

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

    await saveData(updatedDatabase);
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!database) return;

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

    await saveData(updatedDatabase);
  };

  const getStatistics = () => {
    if (!database) {
      return {
        totalClients: 0,
        totalDebts: 0,
        pendingDebts: 0,
        overdueDebts: 0,
        paidDebts: 0,
        totalAmount: 0,
        overdueAmount: 0,
        messagesTotal: 0,
        messagesSent: 0
      };
    }

    const totalClients = database.clients.length;
    const totalDebts = database.debts.length;
    const pendingDebts = database.debts.filter(d => d.status === 'pendente').length;
    const overdueDebts = database.debts.filter(d => d.status === 'atrasado').length;
    const paidDebts = database.debts.filter(d => d.status === 'pago').length;
    
    const totalAmount = database.debts
      .filter(d => d.status !== 'pago')
      .reduce((sum, debt) => sum + debt.valor, 0);
    
    const overdueAmount = database.debts
      .filter(d => d.status === 'atrasado')
      .reduce((sum, debt) => sum + debt.valor, 0);

    return {
      totalClients,
      totalDebts,
      pendingDebts,
      overdueDebts,
      paidDebts,
      totalAmount,
      overdueAmount,
      messagesTotal: database.collectionHistory.length,
      messagesSent: database.collectionHistory.filter(m => m.statusEntrega === 'enviada').length
    };
  };

  const exportData = () => {
    return database ? JSON.stringify(database, null, 2) : '';
  };

  const importData = async (jsonData: string) => {
    try {
      const importedData = JSON.parse(jsonData);
      if (importedData.clients && Array.isArray(importedData.clients)) {
        const newData: LocalDataStructure = {
          ...importedData,
          metadata: {
            version: '1.0',
            lastModified: new Date().toISOString(),
            userId: user?.id || 'unknown',
            backupCount: 0
          }
        };
        await saveData(newData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao importar dados:', error);
      return false;
    }
  };

  const getBackupsList = async () => {
    if (isConnected && directoryHandle && user) {
      return await localDataService.getBackupsList();
    }
    return [];
  };

  const restoreFromBackup = async (backupName: string) => {
    if (isConnected && directoryHandle && user) {
      const restoredData = await localDataService.restoreFromBackup(backupName);
      if (restoredData) {
        setDatabase(restoredData);
        return true;
      }
    }
    return false;
  };

  return {
    // Estado
    database,
    isLoaded,
    loading,
    statistics: getStatistics(),

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
    getBackupsList,
    restoreFromBackup,

    // Utilitários
    refresh: () => loadFromLocalStorage()
  };
};
