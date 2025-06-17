
import { useState, useEffect } from 'react';
import { useDataManager } from './useDataManager';

export interface CobrancaMetrics {
  totalClients: number;
  activeDebts: number;
  overdueDebts: number;
  totalAmount: number;
  overdueAmount: number;
  messagesSent: number;
  responseRate: number;
}

export const useCobrancaMetrics = () => {
  const { statistics, loading } = useDataManager();
  const [metrics, setMetrics] = useState<CobrancaMetrics>({
    totalClients: 0,
    activeDebts: 0,
    overdueDebts: 0,
    totalAmount: 0,
    overdueAmount: 0,
    messagesSent: 0,
    responseRate: 0
  });

  useEffect(() => {
    if (!loading && statistics) {
      setMetrics({
        totalClients: statistics.totalClients,
        activeDebts: statistics.pendingDebts,
        overdueDebts: statistics.overdueDebts,
        totalAmount: statistics.totalAmount,
        overdueAmount: statistics.overdueAmount,
        messagesSent: statistics.messagesSent,
        responseRate: statistics.messagesTotal > 0 ? (statistics.messagesSent / statistics.messagesTotal) * 100 : 0
      });
    }
  }, [statistics, loading]);

  return {
    metrics,
    loading
  };
};
