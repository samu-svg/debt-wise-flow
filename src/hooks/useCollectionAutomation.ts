
import { useState, useEffect } from 'react';
import { useDataManager } from './useDataManager';
import { useSupabaseData } from './useSupabaseData';

export interface AutomationConfig {
  enabled: boolean;
  checkInterval: number;
  maxMessagesPerDay: number;
  workingHours: {
    start: string;
    end: string;
  };
}

export const useCollectionAutomation = () => {
  const { clients, debts } = useDataManager();
  const { loading } = useSupabaseData();
  const [config, setConfig] = useState<AutomationConfig>({
    enabled: false,
    checkInterval: 60000, // 1 minuto
    maxMessagesPerDay: 50,
    workingHours: {
      start: '09:00',
      end: '17:00'
    }
  });

  const updateConfig = (newConfig: Partial<AutomationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const getOverdueDebts = () => {
    const today = new Date();
    return debts.filter(debt => {
      if (debt.status === 'pago') return false;
      const dueDate = new Date(debt.data_vencimento || '');
      return dueDate < today;
    });
  };

  return {
    config,
    updateConfig,
    overdueDebts: getOverdueDebts(),
    clients,
    debts,
    loading
  };
};
