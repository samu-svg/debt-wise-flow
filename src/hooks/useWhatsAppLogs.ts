
import { useState, useCallback, useEffect, useMemo } from 'react';
import type { WhatsAppLog } from '@/types/whatsapp';

const STORAGE_KEY = 'whatsapp_cloud_logs';
const MAX_LOGS = 500; // Reduzido de 1000 para melhor performance
const MAX_LOG_AGE_DAYS = 30;

export const useWhatsAppLogs = () => {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);

  // Carregar logs salvos
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem(STORAGE_KEY);
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs) as WhatsAppLog[];
        // Aplicar rotação de logs ao carregar
        const rotatedLogs = rotateLogs(parsedLogs);
        setLogs(rotatedLogs);
        
        // Se houve rotação, salvar os logs limpos
        if (rotatedLogs.length !== parsedLogs.length) {
          saveLogs(rotatedLogs);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  }, []);

  // Função para rotacionar logs (remover antigos e manter limite)
  const rotateLogs = useCallback((currentLogs: WhatsAppLog[]): WhatsAppLog[] => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000));

    // Filtrar logs por idade e manter apenas os mais recentes
    const filteredByAge = currentLogs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );

    // Manter apenas os últimos MAX_LOGS
    return filteredByAge.slice(-MAX_LOGS);
  }, []);

  // Função otimizada para salvar logs
  const saveLogs = useCallback((newLogs: WhatsAppLog[]) => {
    try {
      const rotatedLogs = rotateLogs(newLogs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rotatedLogs));
      return rotatedLogs;
    } catch (error) {
      console.error('Erro ao salvar logs:', error);
      return newLogs;
    }
  }, [rotateLogs]);

  const addLog = useCallback((type: WhatsAppLog['type'], message: string, data?: unknown): void => {
    const newLog: WhatsAppLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };

    setLogs(currentLogs => {
      const updatedLogs = [...currentLogs, newLog];
      const finalLogs = saveLogs(updatedLogs);
      return finalLogs;
    });
  }, [saveLogs]);

  const clearLogs = useCallback((): void => {
    setLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
    }
  }, []);

  // Estatísticas memoizadas dos logs
  const logStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => 
      new Date(log.timestamp).toDateString() === today
    );

    return {
      total: logs.length,
      today: todayLogs.length,
      errors: logs.filter(log => log.type === 'error').length,
      messages: logs.filter(log => log.type === 'message').length,
      connections: logs.filter(log => log.type === 'connection').length
    };
  }, [logs]);

  return {
    logs,
    logStats,
    addLog,
    clearLogs
  };
};
