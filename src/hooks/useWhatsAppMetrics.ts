
import { useMemo } from 'react';
import type { WhatsAppLog } from '@/types/whatsapp';

interface WhatsAppMetrics {
  messagestoday: number;
  activeConversations: number;
  totalMessages: number;
  errorRate: number;
  dailyStats: {
    messages: number;
    errors: number;
    conversations: Set<string>;
  };
}

export const useWhatsAppMetrics = (logs: WhatsAppLog[]): WhatsAppMetrics => {
  return useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);
    const messageLogs = logs.filter(log => log.type === 'message');
    const errorLogs = logs.filter(log => log.type === 'error');
    
    // Extrair números de telefone únicos das mensagens
    const phoneNumbers = new Set(
      messageLogs
        .filter(log => log.data && typeof log.data === 'object' && 'phoneNumber' in log.data)
        .map(log => (log.data as any).phoneNumber)
        .filter(Boolean)
    );

    const dailyMessages = todayLogs.filter(log => log.type === 'message');
    const dailyErrors = todayLogs.filter(log => log.type === 'error');
    const dailyConversations = new Set(
      dailyMessages
        .filter(log => log.data && typeof log.data === 'object' && 'phoneNumber' in log.data)
        .map(log => (log.data as any).phoneNumber)
        .filter(Boolean)
    );

    return {
      messagestoday: dailyMessages.length,
      activeConversations: phoneNumbers.size,
      totalMessages: messageLogs.length,
      errorRate: messageLogs.length > 0 ? (errorLogs.length / messageLogs.length) * 100 : 0,
      dailyStats: {
        messages: dailyMessages.length,
        errors: dailyErrors.length,
        conversations: dailyConversations
      }
    };
  }, [logs]);
};
