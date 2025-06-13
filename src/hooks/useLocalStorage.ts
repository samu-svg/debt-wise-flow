
import { useState, useEffect } from 'react';
import { Client, Debt, Payment, DashboardMetrics } from '@/types';

const STORAGE_KEYS = {
  CLIENTS: 'debt_manager_clients',
  SETTINGS: 'debt_manager_settings'
};

export const useLocalStorage = () => {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (saved) {
      setClients(JSON.parse(saved));
    }
  };

  const saveClients = (newClients: Client[]) => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newClients));
    setClients(newClients);
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
      version: '1.0'
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
    addClient,
    updateClient,
    deleteClient,
    addDebt,
    updateDebt,
    addPayment,
    calculateInterest,
    getDashboardMetrics,
    exportData,
    importData
  };
};
