import { useState, useEffect } from 'react';
import { useFileSystemBackup } from './useFileSystemBackup';

// Tipos para armazenamento local
export interface LocalClient {
  id: string;
  nome: string;
  whatsapp: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalDebt {
  id: string;
  clientId: string;
  valor: number;
  dataVencimento: string;
  status: 'pendente' | 'pago' | 'atrasado';
  descricao?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionMessage {
  id: string;
  clientId: string;
  debtId: string;
  data: string;
  tipoMensagem: string;
  statusEntrega: 'pendente' | 'enviada' | 'entregue' | 'erro';
  mensagem: string;
  templateUsado: string;
  erroDetalhes?: string;
}

export interface UserSettings {
  automacaoAtiva: boolean;
  diasAntesLembrete: number;
  diasAposVencimento: number[];
  templatesPersonalizados: Record<string, string>;
  horarioEnvio: string;
  updatedAt: string;
}

export interface LocalDatabase {
  clients: LocalClient[];
  debts: LocalDebt[];
  collectionHistory: CollectionMessage[];
  settings: UserSettings;
  version: string;
  lastBackup: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  automacaoAtiva: false,
  diasAntesLembrete: 3,
  diasAposVencimento: [1, 7, 15, 30],
  templatesPersonalizados: {},
  horarioEnvio: '09:00',
  updatedAt: new Date().toISOString()
};

const STORAGE_KEY = 'debt_manager_local_data';

export const useLocalDataManager = () => {
  const { saveData, isConnected, isSupported } = useFileSystemBackup();
  const [database, setDatabase] = useState<LocalDatabase>({
    clients: [],
    debts: [],
    collectionHistory: [],
    settings: DEFAULT_SETTINGS,
    version: '1.0',
    lastBackup: new Date().toISOString()
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadLocalData();
  }, []);

  // Auto-salvar quando conectado
  useEffect(() => {
    if (isLoaded && isConnected) {
      console.log('Sistema conectado - dados serão salvos automaticamente na pasta');
      autoSave();
    }
  }, [database, isLoaded, isConnected]);

  const loadLocalData = () => {
    try {
      console.log('Carregando dados do localStorage...');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        setDatabase({
          ...parsedData,
          settings: { ...DEFAULT_SETTINGS, ...parsedData.settings }
        });
        console.log('Dados carregados:', parsedData.clients?.length || 0, 'clientes,', parsedData.debts?.length || 0, 'dívidas');
      } else {
        console.log('Nenhum dado encontrado no localStorage');
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar dados locais:', error);
      setIsLoaded(true);
    }
  };

  const saveLocalData = async (newDatabase: LocalDatabase) => {
    try {
      console.log('Salvando dados localmente...');
      
      // SEMPRE salvar no localStorage primeiro
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDatabase));
      setDatabase(newDatabase);
      console.log('Dados salvos no localStorage:', newDatabase.clients.length, 'clientes,', newDatabase.debts.length, 'dívidas');

      // Tentar salvar na pasta local APENAS se conectada e suportada
      if (isConnected && isSupported && saveData) {
        try {
          const filename = `debt_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
          console.log('Tentando salvar na pasta local:', filename);
          
          const success = await saveData(JSON.stringify(newDatabase, null, 2), filename);
          if (success) {
            console.log('✅ Backup salvo na pasta local com sucesso');
          } else {
            console.log('⚠️ Falha ao salvar na pasta local - dados mantidos no localStorage');
          }
        } catch (error) {
          console.warn('Erro ao salvar na pasta local (dados seguros no localStorage):', error);
        }
      } else {
        console.log('📁 Pasta não conectada - dados salvos apenas no navegador');
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      throw error;
    }
  };

  const autoSave = async () => {
    const updatedDatabase = {
      ...database,
      lastBackup: new Date().toISOString()
    };
    await saveLocalData(updatedDatabase);
  };

  // Funções para Clientes
  const addClient = async (clientData: Omit<LocalClient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClient: LocalClient = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedDatabase = {
      ...database,
      clients: [...database.clients, newClient]
    };

    await saveLocalData(updatedDatabase);
    return newClient;
  };

  const updateClient = async (id: string, updates: Partial<LocalClient>) => {
    const updatedDatabase = {
      ...database,
      clients: database.clients.map(client =>
        client.id === id
          ? { ...client, ...updates, updatedAt: new Date().toISOString() }
          : client
      )
    };

    await saveLocalData(updatedDatabase);
  };

  const deleteClient = async (id: string) => {
    const updatedDatabase = {
      ...database,
      clients: database.clients.filter(client => client.id !== id),
      debts: database.debts.filter(debt => debt.clientId !== id),
      collectionHistory: database.collectionHistory.filter(msg => msg.clientId !== id)
    };

    await saveLocalData(updatedDatabase);
  };

  // Funções para Dívidas
  const addDebt = async (debtData: Omit<LocalDebt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDebt: LocalDebt = {
      ...debtData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedDatabase = {
      ...database,
      debts: [...database.debts, newDebt]
    };

    await saveLocalData(updatedDatabase);
    return newDebt;
  };

  const updateDebt = async (id: string, updates: Partial<LocalDebt>) => {
    const updatedDatabase = {
      ...database,
      debts: database.debts.map(debt =>
        debt.id === id
          ? { ...debt, ...updates, updatedAt: new Date().toISOString() }
          : debt
      )
    };

    await saveLocalData(updatedDatabase);
  };

  const deleteDebt = async (id: string) => {
    const updatedDatabase = {
      ...database,
      debts: database.debts.filter(debt => debt.id !== id),
      collectionHistory: database.collectionHistory.filter(msg => msg.debtId !== id)
    };

    await saveLocalData(updatedDatabase);
  };

  // Funções para Histórico de Cobrança
  const addCollectionMessage = async (messageData: Omit<CollectionMessage, 'id'>) => {
    const newMessage: CollectionMessage = {
      ...messageData,
      id: Date.now().toString()
    };

    const updatedDatabase = {
      ...database,
      collectionHistory: [...database.collectionHistory, newMessage]
    };

    await saveLocalData(updatedDatabase);
    return newMessage;
  };

  const updateMessageStatus = async (id: string, status: CollectionMessage['statusEntrega'], erroDetalhes?: string) => {
    const updatedDatabase = {
      ...database,
      collectionHistory: database.collectionHistory.map(msg =>
        msg.id === id
          ? { ...msg, statusEntrega: status, erroDetalhes }
          : msg
      )
    };

    await saveLocalData(updatedDatabase);
  };

  // Funções para Configurações
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updatedDatabase = {
      ...database,
      settings: {
        ...database.settings,
        ...newSettings,
        updatedAt: new Date().toISOString()
      }
    };

    await saveLocalData(updatedDatabase);
  };

  // Backup manual para download (quando usuário solicita)
  const exportData = () => {
    return JSON.stringify(database, null, 2);
  };

  const importData = async (jsonData: string) => {
    try {
      const importedData = JSON.parse(jsonData);
      if (importedData.clients && Array.isArray(importedData.clients)) {
        await saveLocalData({
          ...importedData,
          settings: { ...DEFAULT_SETTINGS, ...importedData.settings },
          version: '1.0',
          lastBackup: new Date().toISOString()
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  };

  // Restaurar dados da pasta local
  const restoreFromFolder = async () => {
    if (!isConnected || !saveData) {
      throw new Error('Pasta não conectada');
    }

    // Implementar leitura da pasta quando necessário
    console.log('Função de restauração será implementada conforme necessário');
  };

  // Estatísticas
  const getStatistics = () => {
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

  return {
    // Estado
    database,
    isLoaded,
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
    restoreFromFolder,

    // Utilitários
    refresh: loadLocalData
  };
};
