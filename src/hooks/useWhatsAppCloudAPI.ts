
import { useMemo } from 'react';
import { useWhatsAppConfig } from './useWhatsAppConfig';
import { useWhatsAppLogs } from './useWhatsAppLogs';
import { useWhatsAppMetrics } from './useWhatsAppMetrics';
import { useWhatsAppConnection } from './useWhatsAppConnection';
import { useWhatsAppTemplates } from './useWhatsAppTemplates';
import { useWhatsAppMessaging } from './useWhatsAppMessaging';
import { useWhatsAppValidation } from './useWhatsAppValidation';

interface UseWhatsAppCloudAPIReturn {
  connection: import('@/types/whatsapp').WhatsAppConnection;
  config: Partial<import('@/types/whatsapp').WhatsAppConfig>;
  logs: import('@/types/whatsapp').WhatsAppLog[];
  templates: import('@/types/whatsapp').WhatsAppTemplate[];
  metrics: ReturnType<typeof useWhatsAppMetrics>;
  logStats: ReturnType<typeof useWhatsAppLogs>['logStats'];
  isLoading: boolean;
  isConfigDirty: boolean;
  testConnection: () => Promise<boolean>;
  disconnect: () => void;
  sendMessage: (phoneNumber: string, message: string, templateName?: string) => Promise<string>;
  loadTemplates: () => Promise<void>;
  validateConfiguration: () => Promise<boolean>;
  clearLogs: () => void;
  updateConfig: (newConfig: Partial<import('@/types/whatsapp').WhatsAppConfig>) => void;
}

export const useWhatsAppCloudAPI = (): UseWhatsAppCloudAPIReturn => {
  // Hooks especializados
  const { config, updateConfig, isConfigDirty } = useWhatsAppConfig();
  const { logs, logStats, addLog, clearLogs } = useWhatsAppLogs();
  const { connection, updateConnection, resetConnection } = useWhatsAppConnection();
  const { templates, isLoading: templatesLoading, loadTemplates: loadTemplatesAction, clearTemplates } = useWhatsAppTemplates();
  const { isValidating, validateConfiguration: validateConfig, testConnection: testConn } = useWhatsAppValidation();
  const { sendMessage } = useWhatsAppMessaging(connection, config, addLog);
  
  // Métricas memoizadas
  const metrics = useWhatsAppMetrics(logs);
  
  // Estado de loading combinado
  const isLoading = useMemo(() => templatesLoading || isValidating, [templatesLoading, isValidating]);

  // Funções memoizadas para evitar re-renders
  const loadTemplates = useMemo(() => async (): Promise<void> => {
    await loadTemplatesAction(config, addLog);
  }, [loadTemplatesAction, config, addLog]);

  const validateConfiguration = useMemo(() => async (): Promise<boolean> => {
    return await validateConfig(config, addLog);
  }, [validateConfig, config, addLog]);

  const testConnection = useMemo(() => async (): Promise<boolean> => {
    return await testConn(config, addLog, updateConnection, loadTemplates);
  }, [testConn, config, addLog, updateConnection, loadTemplates]);

  const disconnect = useMemo(() => (): void => {
    resetConnection();
    clearTemplates();
    addLog('connection', 'WhatsApp desconectado');
  }, [resetConnection, clearTemplates, addLog]);

  // Retorno memoizado para evitar re-renders desnecessários
  return useMemo(() => ({
    connection,
    config,
    logs,
    templates,
    metrics,
    logStats,
    isLoading,
    isConfigDirty,
    testConnection,
    disconnect,
    sendMessage,
    loadTemplates,
    validateConfiguration,
    clearLogs,
    updateConfig
  }), [
    connection,
    config,
    logs,
    templates,
    metrics,
    logStats,
    isLoading,
    isConfigDirty,
    testConnection,
    disconnect,
    sendMessage,
    loadTemplates,
    validateConfiguration,
    clearLogs,
    updateConfig
  ]);
};
