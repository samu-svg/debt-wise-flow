
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppMessage {
  id: string;
  phoneNumber: string;
  messageText?: string;
  templateName?: string;
  whatsappMessageId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

interface UseWhatsAppMessagesReturn {
  messages: WhatsAppMessage[];
  isLoading: boolean;
  saveMessage: (message: Partial<WhatsAppMessage>) => Promise<string | null>;
  updateMessageStatus: (id: string, status: WhatsAppMessage['status'], data?: Partial<WhatsAppMessage>) => Promise<void>;
  getRecentMessages: (limit?: number) => Promise<void>;
  getMessageStats: () => {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
}

export const useWhatsAppMessages = (): UseWhatsAppMessagesReturn => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const saveMessage = useCallback(async (message: Partial<WhatsAppMessage>): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('whatsapp_messages' as any)
        .insert({
          user_id: user.id,
          phone_number: message.phoneNumber!,
          message_text: message.messageText,
          template_name: message.templateName,
          status: message.status || 'pending',
          retry_count: message.retryCount || 0
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar mensagem:', error);
        return null;
      }

      if (data) {
        const newMessage: WhatsAppMessage = {
          id: data.id,
          phoneNumber: data.phone_number,
          messageText: data.message_text,
          templateName: data.template_name,
          whatsappMessageId: data.whatsapp_message_id,
          status: data.status as WhatsAppMessage['status'],
          errorMessage: data.error_message,
          errorCode: data.error_code,
          retryCount: data.retry_count,
          sentAt: data.sent_at,
          deliveredAt: data.delivered_at,
          createdAt: data.created_at
        };

        setMessages(prev => [newMessage, ...prev]);
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      return null;
    }
  }, []);

  const updateMessageStatus = useCallback(async (
    id: string, 
    status: WhatsAppMessage['status'], 
    data?: Partial<WhatsAppMessage>
  ) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (data?.whatsappMessageId) updateData.whatsapp_message_id = data.whatsappMessageId;
      if (data?.errorMessage) updateData.error_message = data.errorMessage;
      if (data?.errorCode) updateData.error_code = data.errorCode;
      if (data?.retryCount !== undefined) updateData.retry_count = data.retryCount;
      if (status === 'sent') updateData.sent_at = new Date().toISOString();
      if (status === 'delivered') updateData.delivered_at = new Date().toISOString();

      const { error } = await supabase
        .from('whatsapp_messages' as any)
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status da mensagem:', error);
        return;
      }

      setMessages(prev => prev.map(msg => 
        msg.id === id 
          ? { 
              ...msg, 
              status, 
              whatsappMessageId: data?.whatsappMessageId || msg.whatsappMessageId,
              errorMessage: data?.errorMessage || msg.errorMessage,
              errorCode: data?.errorCode || msg.errorCode,
              retryCount: data?.retryCount !== undefined ? data.retryCount : msg.retryCount,
              sentAt: status === 'sent' ? new Date().toISOString() : msg.sentAt,
              deliveredAt: status === 'delivered' ? new Date().toISOString() : msg.deliveredAt
            }
          : msg
      ));
    } catch (error) {
      console.error('Erro ao atualizar status da mensagem:', error);
    }
  }, []);

  const getRecentMessages = useCallback(async (limit = 50) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('whatsapp_messages' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao carregar mensagens:', error);
        return;
      }

      const formattedMessages: WhatsAppMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        phoneNumber: msg.phone_number,
        messageText: msg.message_text,
        templateName: msg.template_name,
        whatsappMessageId: msg.whatsapp_message_id,
        status: msg.status as WhatsAppMessage['status'],
        errorMessage: msg.error_message,
        errorCode: msg.error_code,
        retryCount: msg.retry_count,
        sentAt: msg.sent_at,
        deliveredAt: msg.delivered_at,
        createdAt: msg.created_at
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMessageStats = useCallback(() => {
    return {
      total: messages.length,
      sent: messages.filter(m => m.status === 'sent' || m.status === 'delivered').length,
      failed: messages.filter(m => m.status === 'failed').length,
      pending: messages.filter(m => m.status === 'pending').length
    };
  }, [messages]);

  useEffect(() => {
    getRecentMessages();
  }, [getRecentMessages]);

  return useMemo(() => ({
    messages,
    isLoading,
    saveMessage,
    updateMessageStatus,
    getRecentMessages,
    getMessageStats
  }), [messages, isLoading, saveMessage, updateMessageStatus, getRecentMessages, getMessageStats]);
};
