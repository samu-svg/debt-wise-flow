
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsAppConnection } from '@/types/whatsapp';

interface UseWhatsAppMessagingReturn {
  sendMessage: (phoneNumber: string, message: string, templateName?: string) => Promise<string>;
}

export const useWhatsAppMessaging = (
  connection: WhatsAppConnection,
  config: any,
  addLog: (type: string, message: string, data?: any) => void
): UseWhatsAppMessagingReturn => {
  
  const sendMessage = useCallback(async (phoneNumber: string, message: string, templateName?: string): Promise<string> => {
    if (!connection.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    if (!phoneNumber || (!message && !templateName)) {
      throw new Error('Número e mensagem/template são obrigatórios');
    }

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'send_message',
          phoneNumber,
          message,
          templateName,
          config
        }
      });

      if (error) {
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        const logMessage = templateName 
          ? `Template "${templateName}" enviado para ${phoneNumber}`
          : `Mensagem enviada para ${phoneNumber}`;
          
        addLog('message', logMessage, { 
          messageId: data.messageId,
          message: templateName || message,
          phoneNumber,
          type: templateName ? 'template' : 'text'
        });
        return data.messageId as string;
      } else {
        throw new Error(data?.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao enviar mensagem';
      addLog('error', `Erro ao enviar mensagem: ${errorMessage}`, { error, phoneNumber });
      throw error;
    }
  }, [connection, config, addLog]);

  return useMemo(() => ({
    sendMessage
  }), [sendMessage]);
};
