
import { useState, useEffect } from 'react';
import { useSupabaseData } from './useSupabaseData';

export const useLocalAutomation = () => {
  const [isActive, setIsActive] = useState(false);
  const [lastExecution, setLastExecution] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { clientes, dividas } = useSupabaseData();

  // Configuração padrão
  const [config, setConfig] = useState({
    enabled: false,
    checkTimes: ['09:00', '14:00', '17:00'],
    maxMessagesPerDay: 50,
    workingHours: {
      start: '09:00',
      end: '17:00'
    }
  });

  // Estatísticas
  const stats = {
    totalSent: 0,
    responseRate: 0,
    pendingConversations: 0,
    conversionsToday: 0
  };

  // Calcular dívidas em atraso
  const overdueDebts = dividas.filter(divida => {
    if (divida.status === 'pago') return false;
    const today = new Date();
    const dueDate = new Date(divida.data_vencimento || '');
    return dueDate < today;
  });

  const startAutomation = () => {
    setIsActive(true);
    setLastExecution(new Date());
    console.log('Local automation started');
  };

  const stopAutomation = () => {
    setIsActive(false);
    console.log('Local automation stopped');
  };

  const updateConfig = async (newConfig: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const processAutomaticCollections = async () => {
    setIsProcessing(true);
    try {
      console.log('Processing automatic collections...');
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isActive,
    lastExecution,
    startAutomation,
    stopAutomation,
    clientesCount: clientes?.length || 0,
    config,
    stats,
    overdueDebts,
    isProcessing,
    updateConfig,
    processAutomaticCollections
  };
};
