
import { useMemo } from 'react';
import { useWhatsAppCredentials } from './useWhatsAppCredentials';
import { useWhatsAppMessages } from './useWhatsAppMessages';
import { useWhatsAppAllowlist } from './useWhatsAppAllowlist';
import { useWhatsAppLogs } from './useWhatsAppLogs';
import { useWhatsAppMetrics } from './useWhatsAppMetrics';
import { useWhatsAppConnection } from './useWhatsAppConnection';
import { useWhatsAppTemplates } from './useWhatsAppTemplates';
import { useWhatsAppHealthMonitor } from './useWhatsAppHealthMonitor';
import { useWhatsAppDiagnostics } from './useWhatsAppDiagnostics';
import { supabase } from '@/integrations/supabase/client';

interface UseWhatsAppCloudAPIReturn {
  connection: import('@/types/whatsapp').WhatsAppConnection;
  config: any;
  logs: import('@/types/whatsapp').WhatsAppLog[];
  templates: import('@/types/whatsapp').WhatsAppTemplate[];
  metrics: ReturnType<typeof useWhatsAppMetrics>;
  logStats: ReturnType<typeof useWhatsAppLogs>['logStats'];
  messages: ReturnType<typeof useWhatsAppMessages>['messages'];
  allowlist: ReturnType<typeof useWhatsAppAllowlist>['allowlist'];
  credentials: ReturnType<typeof useWhatsAppCredentials>['credentials'];
  isLoading: boolean;
  isConfigDirty: boolean;
  testConnection: () => Promise<boolean>;
  disconnect: () => void;
  sendMessage: (phoneNumber: string, message: string, templateName?: string) => Promise<string>;
  loadTemplates: () => Promise<void>;
  validateConfiguration: () => Promise<boolean>;
  clearLogs: () => void;
  updateConfig: (newConfig: any) => void;
  saveCredentials: (creds: any) => Promise<boolean>;
  addToAllowlist: (phoneNumber: string, name?: string) => Promise<boolean>;
  removeFromAllowlist: (id: string) => Promise<boolean>;
  isNumberAllowed: (phoneNumber: string) => boolean;
}

export const useWhatsAppCloudAPI = (): UseWhatsAppCloudAPIReturn => {
  // Hooks especializados
  const { credentials, isLoading: credsLoading, isConfigDirty, saveCredentials } = useWhatsAppCredentials();
  const { messages, saveMessage, updateMessageStatus } = useWhatsAppMessages();
  const { allowlist, addNumber, removeNumber, isNumberAllowed } = useWhatsAppAllowlist();
  const { logs, logStats, addLog, clearLogs } = useWhatsAppLogs();
  const { connection, updateConnection, resetConnection } = useWhatsAppConnection();
  const { templates, isLoading: templatesLoading, loadTemplates: loadTemplatesAction } = useWhatsAppTemplates();
  const { healthStatus, startMonitoring, stopMonitoring, forceHealthCheck } = useWhatsAppHealthMonitor();
  const { runFullDiagnostic, testSendMessage } = useWhatsAppDiagnostics();

  // Métricas memoizadas
  const metrics = useWhatsAppMetrics(logs);
  
  // Estado de loading combinado
  const isLoading = useMemo(() => credsLoading || templatesLoading, [credsLoading, templatesLoading]);

  // Função para enviar mensagem com integração ao banco
  const sendMessage = useMemo(() => async (phoneNumber: string, message: string, templateName?: string): Promise<string> => {
    console.log('🚀 Iniciando envio de mensagem...');
    
    // Verificar se número está na allowlist
    if (!isNumberAllowed(phoneNumber)) {
      const error = 'Número não está na lista de aprovados';
      addLog('error', error, { phoneNumber });
      throw new Error(error);
    }

    // Salvar mensagem no banco
    const messageId = await saveMessage({
      phoneNumber,
      messageText: message,
      templateName,
      status: 'pending'
    });

    if (!messageId) {
      throw new Error('Falha ao salvar mensagem no banco de dados');
    }

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'send_message',
          phoneNumber,
          message,
          templateName,
          messageId
        }
      });

      if (error) {
        await updateMessageStatus(messageId, 'failed', { 
          errorMessage: error.message 
        });
        addLog('error', `Erro na função: ${error.message}`, { phoneNumber, messageId });
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        await updateMessageStatus(messageId, 'sent', { 
          whatsappMessageId: data.messageId 
        });
        
        addLog('message', templateName 
          ? `Template "${templateName}" enviado para ${phoneNumber}`
          : `Mensagem enviada para ${phoneNumber}`, 
          { messageId: data.messageId, phoneNumber, type: templateName ? 'template' : 'text' }
        );
        
        return data.messageId as string;
      } else {
        await updateMessageStatus(messageId, 'failed', { 
          errorMessage: data?.error || 'Erro desconhecido',
          errorCode: data?.errorCode 
        });
        
        addLog('error', `Falha no envio: ${data?.error || 'Erro desconhecido'}`, { phoneNumber, messageId });
        throw new Error(data?.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao enviar mensagem';
      await updateMessageStatus(messageId, 'failed', { errorMessage });
      addLog('error', `Erro ao enviar mensagem: ${errorMessage}`, { error, phoneNumber, messageId });
      throw error;
    }
  }, [isNumberAllowed, saveMessage, updateMessageStatus, addLog]);

  // Outras funções memoizadas
  const loadTemplates = useMemo(() => async (): Promise<void> => {
    await loadTemplatesAction(credentials, addLog);
  }, [loadTemplatesAction, credentials, addLog]);

  const validateConfiguration = useMemo(() => async (): Promise<boolean> => {
    const results = await runFullDiagnostic(credentials);
    return results.every(r => r.success);
  }, [runFullDiagnostic, credentials]);

  const testConnection = useMemo(() => async (): Promise<boolean> => {
    return await forceHealthCheck(credentials);
  }, [forceHealthCheck, credentials]);

  const disconnect = useMemo(() => (): void => {
    resetConnection();
    stopMonitoring();
    addLog('connection', 'WhatsApp desconectado');
  }, [resetConnection, stopMonitoring, addLog]);

  const updateConfig = useMemo(() => (newConfig: any): void => {
    saveCredentials(newConfig);
  }, [saveCredentials]);

  // Retorno memoizado
  return useMemo(() => ({
    connection,
    config: credentials,
    logs,
    templates,
    metrics,
    logStats,
    messages,
    allowlist,
    credentials,
    isLoading,
    isConfigDirty,
    testConnection,
    disconnect,
    sendMessage,
    loadTemplates,
    validateConfiguration,
    clearLogs,
    updateConfig,
    saveCredentials,
    addToAllowlist: addNumber,
    removeFromAllowlist: removeNumber,
    isNumberAllowed
  }), [
    connection,
    credentials,
    logs,
    templates,
    metrics,
    logStats,
    messages,
    allowlist,
    isLoading,
    isConfigDirty,
    testConnection,
    disconnect,
    sendMessage,
    loadTemplates,
    validateConfiguration,
    clearLogs,
    updateConfig,
    saveCredentials,
    addNumber,
    removeNumber,
    isNumberAllowed
  ]);
};
