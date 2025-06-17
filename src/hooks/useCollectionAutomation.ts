
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
  checkTimes: string[];
  holidays: string[];
  responseTimeout: number;
  messageDelay: number;
  escalation: {
    beforeDue: number;
    onDue: number;
    afterDue1: number;
    afterDue7: number;
    afterDue15: number;
    afterDue30: number;
  };
}

export interface AutomationStats {
  totalSent: number;
  responseRate: number;
  pendingConversations: number;
  conversionsToday: number;
}

export const useCollectionAutomation = () => {
  const { clients, debts } = useDataManager();
  const { loading } = useSupabaseData();
  const [config, setConfig] = useState<AutomationConfig>({
    enabled: false,
    checkInterval: 60000,
    maxMessagesPerDay: 50,
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    checkTimes: ['09:00', '14:00', '17:00'],
    holidays: [],
    responseTimeout: 172800000, // 48 horas
    messageDelay: 2000,
    escalation: {
      beforeDue: -3,
      onDue: 0,
      afterDue1: 1,
      afterDue7: 7,
      afterDue15: 15,
      afterDue30: 30
    }
  });

  const [stats] = useState<AutomationStats>({
    totalSent: 0,
    responseRate: 0,
    pendingConversations: 0,
    conversionsToday: 0
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

  const canSendToClient = (clientId: string, debtId: string) => {
    return { canSend: true, reason: '' };
  };

  const getMessageType = (daysOverdue: number) => {
    if (daysOverdue < 0) return 'lembrete';
    if (daysOverdue === 0) return 'vencimento';
    if (daysOverdue <= 7) return 'cobranca_leve';
    if (daysOverdue <= 15) return 'cobranca_formal';
    return 'ultimo_aviso';
  };

  const processClientResponse = (clientId: string, response: string) => {
    console.log('Processing response:', { clientId, response });
  };

  return {
    config,
    updateConfig,
    overdueDebts: getOverdueDebts(),
    clients,
    debts,
    loading,
    stats,
    isProcessing: false,
    canSendToClient,
    getMessageType,
    processClientResponse
  };
};
