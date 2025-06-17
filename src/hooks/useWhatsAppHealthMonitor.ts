
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsAppConfig } from '@/types/whatsapp';

interface HealthStatus {
  isHealthy: boolean;
  lastCheck: string;
  consecutiveFailures: number;
  uptime: number;
  responseTime: number;
  errorRate: number;
}

interface UseWhatsAppHealthMonitorReturn {
  healthStatus: HealthStatus;
  isMonitoring: boolean;
  startMonitoring: (config: Partial<WhatsAppConfig>) => void;
  stopMonitoring: () => void;
  forceHealthCheck: (config: Partial<WhatsAppConfig>) => Promise<boolean>;
}

const HEALTH_CHECK_INTERVAL = 30000; // 30 segundos
const MAX_CONSECUTIVE_FAILURES = 3;

export const useWhatsAppHealthMonitor = (): UseWhatsAppHealthMonitorReturn => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    isHealthy: false,
    lastCheck: '',
    consecutiveFailures: 0,
    uptime: 0,
    responseTime: 0,
    errorRate: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [totalChecks, setTotalChecks] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);

  const performHealthCheck = useCallback(async (config: Partial<WhatsAppConfig>): Promise<boolean> => {
    console.log('🏥 Executando health check...');
    const checkStart = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'test_connection',
          config
        }
      });

      const responseTime = Date.now() - checkStart;
      const isHealthy = !error && data?.success;
      
      setTotalChecks(prev => prev + 1);
      if (!isHealthy) {
        setTotalErrors(prev => prev + 1);
      }

      setHealthStatus(prev => {
        const newConsecutiveFailures = isHealthy ? 0 : prev.consecutiveFailures + 1;
        const newUptime = startTime > 0 ? Date.now() - startTime : 0;
        const newErrorRate = totalChecks > 0 ? (totalErrors / totalChecks) * 100 : 0;
        
        return {
          isHealthy: isHealthy && newConsecutiveFailures < MAX_CONSECUTIVE_FAILURES,
          lastCheck: new Date().toISOString(),
          consecutiveFailures: newConsecutiveFailures,
          uptime: newUptime,
          responseTime,
          errorRate: newErrorRate
        };
      });

      console.log(`🏥 Health check concluído: ${isHealthy ? 'SAUDÁVEL' : 'PROBLEMA'} (${responseTime}ms)`);
      return isHealthy;
    } catch (error) {
      console.error('🏥 Erro no health check:', error);
      
      setTotalChecks(prev => prev + 1);
      setTotalErrors(prev => prev + 1);
      
      setHealthStatus(prev => ({
        ...prev,
        isHealthy: false,
        lastCheck: new Date().toISOString(),
        consecutiveFailures: prev.consecutiveFailures + 1,
        responseTime: Date.now() - checkStart,
        errorRate: totalChecks > 0 ? (totalErrors / totalChecks) * 100 : 100
      }));
      
      return false;
    }
  }, [startTime, totalChecks, totalErrors]);

  const forceHealthCheck = useCallback(async (config: Partial<WhatsAppConfig>): Promise<boolean> => {
    return await performHealthCheck(config);
  }, [performHealthCheck]);

  const startMonitoring = useCallback((config: Partial<WhatsAppConfig>) => {
    if (isMonitoring) {
      console.log('🏥 Monitoramento já está ativo');
      return;
    }

    console.log('🏥 Iniciando monitoramento de saúde...');
    setIsMonitoring(true);
    setStartTime(Date.now());
    setTotalChecks(0);
    setTotalErrors(0);

    // Primeira verificação imediata
    performHealthCheck(config);

    // Configurar verificações periódicas
    const id = setInterval(() => {
      performHealthCheck(config);
    }, HEALTH_CHECK_INTERVAL);

    setIntervalId(id);
  }, [isMonitoring, performHealthCheck]);

  const stopMonitoring = useCallback(() => {
    console.log('🏥 Parando monitoramento de saúde...');
    setIsMonitoring(false);
    
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [intervalId]);

  // Cleanup na desmontagem do componente
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return useMemo(() => ({
    healthStatus,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    forceHealthCheck
  }), [healthStatus, isMonitoring, startMonitoring, stopMonitoring, forceHealthCheck]);
};
