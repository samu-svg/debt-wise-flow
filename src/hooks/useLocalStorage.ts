import { useState, useEffect } from 'react';
import { Client, Debt, Payment, DashboardMetrics } from '@/types';
import { useFileSystemBackup } from './useFileSystemBackup';

const STORAGE_KEYS = {
  CLIENTS: 'debt_manager_clients',
  SETTINGS: 'debt_manager_settings'
};

// Hook para salvamento automático na pasta local
let saveToFolderCallback: ((data: any) => void) | null = null;

export const setSaveToFolderCallback = (callback: (data: any) => void) => {
  saveToFolderCallback = callback;
};

export const useLocalStorage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { saveData, isConfigured, directoryHandle } = useFileSystemBackup();

  // Carregar dados iniciais
  useEffect(() => {
    loadClients();
  }, []);

  // Tentar restaurar dados da pasta quando conectar
  useEffect(() => {
    if (isConfigured && directoryHandle && !isInitialized) {
      console.log('Tentando restaurar dados da pasta configurada...');
      restoreFromFolder();
    }
  }, [isConfigured, directoryHandle, isInitialized]);

  const loadClients = () => {
    console.log('Carregando dados do localStorage...');
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (saved) {
      try {
        const parsedClients = JSON.parse(saved);
        console.log('Dados carregados do localStorage:', parsedClients.length, 'clientes');
        setClients(parsedClients);
      } catch (error) {
        console.error('Erro ao parsear dados do localStorage:', error);
        setClients([]);
      }
    } else {
      console.log('Nenhum dado encontrado no localStorage - tentando restaurar da pasta');
      if (isConfigured && directoryHandle) {
        restoreFromFolder();
      }
    }
    setIsInitialized(true);
  };

  const restoreFromFolder = async () => {
    if (!directoryHandle) {
      console.log('Nenhuma pasta configurada para restore');
      return;
    }

    try {
      console.log('Procurando arquivos de backup na pasta...');
      
      // Usar for await...of para iterar sobre as entradas do diretório
      const files = [];
      for await (const [name, handle] of directoryHandle) {
        if (name.includes('debt_manager_backup_') && name.endsWith('.json')) {
          files.push({ name, handle });
        }
      }

      if (files.length === 0) {
        console.log('Nenhum arquivo de backup encontrado na pasta');
        return;
      }

      // Ordenar por data (mais recente primeiro)
      files.sort((a, b) => b.name.localeCompare(a.name));
      const latestFile = files[0];

      console.log('Restaurando dados do arquivo:', latestFile.name);
      
      if (latestFile.handle.kind === 'file') {
        const file = await latestFile.handle.getFile();
        const content = await file.text();
        const data = JSON.parse(content);

        if (data.clients && Array.isArray(data.clients) && data.clients.length > 0) {
          console.log('Restaurando', data.clients.length, 'clientes da pasta');
          localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data.clients));
          setClients(data.clients);
        }
      }
    } catch (error) {
      console.error('Erro ao restaurar dados da pasta:', error);
    }
  };

  const saveClients = async (newClients: Client[]) => {
    console.log('Salvando', newClients.length, 'clientes');
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newClients));
    setClients(newClients);
    
    // Salvar automaticamente na pasta configurada se disponível
    if (isConfigured && saveData) {
      try {
        const data = {
          clients: newClients,
          exportDate: new Date().toISOString(),
          version: '2.0',
          type: 'local_data'
        };
        
        const filename = `debt_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
        console.log('Salvando backup na pasta configurada:', filename);
        await saveData(JSON.stringify(data, null, 2), filename);
      } catch (error) {
        console.error('Erro ao salvar backup automático:', error);
      }
    }
  };

  const addClient = (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'debts'>) => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      debts: []
    };
    saveClients([...clients, newClient]);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    const updated = clients.map(client => 
      client.id === id 
        ? { ...client, ...updates, updatedAt: new Date().toISOString() }
        : client
    );
    saveClients(updated);
  };

  const deleteClient = (id: string) => {
    const filtered = clients.filter(client => client.id !== id);
    saveClients(filtered);
  };

  const addDebt = (clientId: string, debt: Omit<Debt, 'id' | 'clientId' | 'createdAt' | 'updatedAt' | 'payments' | 'currentAmount'>) => {
    const newDebt: Debt = {
      ...debt,
      id: Date.now().toString(),
      clientId,
      currentAmount: debt.originalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: []
    };

    const updated = clients.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            debts: [...client.debts, newDebt],
            updatedAt: new Date().toISOString()
          }
        : client
    );
    saveClients(updated);
    return newDebt;
  };

  const updateDebt = (clientId: string, debtId: string, updates: Partial<Debt>) => {
    const updated = clients.map(client => 
      client.id === clientId 
        ? {
            ...client,
            debts: client.debts.map(debt => 
              debt.id === debtId 
                ? { ...debt, ...updates, updatedAt: new Date().toISOString() }
                : debt
            ),
            updatedAt: new Date().toISOString()
          }
        : client
    );
    saveClients(updated);
  };

  const addPayment = (clientId: string, debtId: string, payment: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment: Payment = {
      ...payment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    const updated = clients.map(client => 
      client.id === clientId 
        ? {
            ...client,
            debts: client.debts.map(debt => 
              debt.id === debtId 
                ? { 
                    ...debt, 
                    payments: [...debt.payments, newPayment],
                    currentAmount: Math.max(0, debt.currentAmount - payment.amount),
                    status: (debt.currentAmount - payment.amount) <= 0 ? 'paid' as const : debt.status,
                    updatedAt: new Date().toISOString()
                  }
                : debt
            ),
            updatedAt: new Date().toISOString()
          }
        : client
    );
    saveClients(updated);
  };

  const calculateInterest = () => {
    const today = new Date();
    const updated = clients.map(client => ({
      ...client,
      debts: client.debts.map(debt => {
        if (debt.status === 'active') {
          const dueDate = new Date(debt.dueDate);
          const monthsDiff = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
          
          if (monthsDiff > 0) {
            const interest = debt.originalAmount * (debt.interestRate / 100) * monthsDiff;
            const newAmount = debt.originalAmount + interest;
            return {
              ...debt,
              currentAmount: Math.max(newAmount - debt.payments.reduce((sum, p) => sum + p.amount, 0), 0),
              status: today > dueDate ? 'overdue' as const : 'active' as const,
              updatedAt: new Date().toISOString()
            };
          }
        }
        return debt;
      })
    }));
    saveClients(updated);
  };

  const getDashboardMetrics = (): DashboardMetrics => {
    const allDebts = clients.flatMap(client => client.debts);
    const totalPaid = allDebts.reduce((sum, debt) => 
      sum + debt.payments.reduce((pSum, payment) => pSum + payment.amount, 0), 0
    );

    return {
      totalClients: clients.length,
      totalDebts: allDebts.length,
      totalAmount: allDebts.reduce((sum, debt) => sum + debt.currentAmount, 0),
      totalPaid,
      totalOverdue: allDebts.filter(debt => debt.status === 'overdue')
        .reduce((sum, debt) => sum + debt.currentAmount, 0),
      overdueCount: allDebts.filter(debt => debt.status === 'overdue').length
    };
  };

  const exportData = () => {
    const data = {
      clients,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.clients && Array.isArray(data.clients)) {
        saveClients(data.clients);
        return true;
      }
    } catch (error) {
      console.error('Error importing data:', error);
    }
    return false;
  };

  return {
    clients,
    isInitialized,
    addClient,
    updateClient,
    deleteClient,
    addDebt,
    updateDebt,
    addPayment,
    calculateInterest,
    getDashboardMetrics,
    exportData,
    importData,
    restoreFromFolder
  };
};
