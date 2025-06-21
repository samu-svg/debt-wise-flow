
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseData } from './useSupabaseData';

export const useRealTimeAutomation = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [automationLog, setAutomationLog] = useState<string[]>([]);
  const { dividas } = useSupabaseData();

  useEffect(() => {
    if (isMonitoring) {
      const channel = supabase
        .channel('debt-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'dividas' }, 
          (payload) => {
            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;
            const recordId = newRecord?.id || oldRecord?.id || 'unknown';
            const logEntry = `${new Date().toISOString()}: Debt ${payload.eventType} - ID: ${recordId}`;
            setAutomationLog(prev => [logEntry, ...prev.slice(0, 49)]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isMonitoring]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    setAutomationLog(prev => [`${new Date().toISOString()}: Real-time monitoring started`, ...prev]);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setAutomationLog(prev => [`${new Date().toISOString()}: Real-time monitoring stopped`, ...prev]);
  };

  return {
    isMonitoring,
    automationLog,
    startMonitoring,
    stopMonitoring,
    pendingDebts: dividas?.filter(d => d.status === 'pendente').length || 0
  };
};
