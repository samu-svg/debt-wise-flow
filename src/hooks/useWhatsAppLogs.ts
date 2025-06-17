
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { WhatsAppLog } from '@/types/whatsapp';

interface DatabaseLog {
  id: string;
  user_id: string;
  level: string;
  type: string;
  message: string;
  data: any;
  timestamp: string;
  session_id?: string;
  function_name?: string;
}

const MAX_LOCAL_LOGS = 100; // Reduzido para melhor performance
const SYNC_INTERVAL = 30000; // 30 segundos

export const useWhatsAppLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Carregar logs do Supabase
  const loadLogsFromDatabase = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;

      const formattedLogs: WhatsAppLog[] = (data || []).map((log: DatabaseLog) => ({
        id: log.id,
        timestamp: log.timestamp,
        type: log.type as WhatsAppLog['type'],
        message: log.message,
        data: log.data
      }));

      setLogs(formattedLogs);
      setLastSync(new Date());
    } catch (error) {
      console.error('Error loading logs from database:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Adicionar log local e enviar para o banco
  const addLog = useCallback(async (
    type: WhatsAppLog['type'], 
    message: string, 
    data?: unknown,
    level: 'info' | 'error' | 'warning' | 'debug' = 'info'
  ): Promise<void> => {
    if (!user) return;

    const newLog: WhatsAppLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };

    // Adicionar ao estado local imediatamente
    setLogs(currentLogs => {
      const updatedLogs = [newLog, ...currentLogs];
      return updatedLogs.slice(0, MAX_LOCAL_LOGS);
    });

    // Enviar para o banco de dados
    try {
      const { error } = await supabase
        .from('whatsapp_logs')
        .insert({
          user_id: user.id,
          level,
          type,
          message,
          data: data ? JSON.stringify(data) : null,
          function_name: 'frontend'
        });

      if (error) {
        console.error('Failed to save log to database:', error);
      }
    } catch (error) {
      console.error('Error saving log:', error);
    }
  }, [user]);

  const clearLogs = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('whatsapp_logs')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setLogs([]);
      await addLog('system', 'Logs limpos pelo usuário');
    } catch (error) {
      console.error('Error clearing logs:', error);
      await addLog('error', 'Erro ao limpar logs', { error });
    }
  }, [user, addLog]);

  // Sincronização automática
  useEffect(() => {
    if (!user) return;

    loadLogsFromDatabase();
    
    const interval = setInterval(() => {
      loadLogsFromDatabase();
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [user, loadLogsFromDatabase]);

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
    loading,
    lastSync,
    addLog,
    clearLogs,
    reloadLogs: loadLogsFromDatabase
  };
};
