
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsAppConfig } from '@/types/whatsapp';

interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

interface UseWhatsAppDiagnosticsReturn {
  isRunning: boolean;
  lastResults: DiagnosticResult[];
  runFullDiagnostic: (config: Partial<WhatsAppConfig>) => Promise<DiagnosticResult[]>;
  testSendMessage: (config: Partial<WhatsAppConfig>, phoneNumber: string, message: string) => Promise<DiagnosticResult>;
  clearResults: () => void;
}

export const useWhatsAppDiagnostics = (): UseWhatsAppDiagnosticsReturn => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResults, setLastResults] = useState<DiagnosticResult[]>([]);

  const createResult = useCallback((success: boolean, message: string, details?: any): DiagnosticResult => ({
    success,
    message,
    details,
    timestamp: new Date().toISOString()
  }), []);

  const validateCredentials = useCallback(async (config: Partial<WhatsAppConfig>): Promise<DiagnosticResult> => {
    console.log('🔍 Validando credenciais...');
    
    if (!config.accessToken) {
      return createResult(false, 'Access Token não configurado');
    }
    
    if (!config.phoneNumberId) {
      return createResult(false, 'Phone Number ID não configurado');
    }
    
    if (!config.businessAccountId) {
      return createResult(false, 'Business Account ID não configurado');
    }
    
    if (!config.accessToken.startsWith('EAA')) {
      return createResult(false, 'Access Token com formato inválido (deve começar com EAA)');
    }
    
    return createResult(true, 'Credenciais configuradas corretamente', {
      tokenPrefix: config.accessToken.substring(0, 10) + '...',
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId
    });
  }, [createResult]);

  const testConnection = useCallback(async (config: Partial<WhatsAppConfig>): Promise<DiagnosticResult> => {
    console.log('🔗 Testando conexão com WhatsApp API...');
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'test_connection',
          config
        }
      });

      if (error) {
        return createResult(false, `Erro na função: ${error.message}`, { error });
      }

      if (data?.success) {
        return createResult(true, 'Conexão estabelecida com sucesso', data.data);
      } else {
        return createResult(false, `Falha na conexão: ${data?.error || 'Erro desconhecido'}`, data);
      }
    } catch (error) {
      return createResult(false, `Erro ao testar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { error });
    }
  }, [createResult]);

  const testPhoneValidation = useCallback((phoneNumber: string): DiagnosticResult => {
    console.log('📞 Validando número de telefone...');
    
    if (!phoneNumber) {
      return createResult(false, 'Número de telefone não informado');
    }
    
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      return createResult(false, 'Número muito curto (mínimo 10 dígitos)');
    }
    
    if (cleanPhone.length > 15) {
      return createResult(false, 'Número muito longo (máximo 15 dígitos)');
    }
    
    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = `55${formattedPhone}`;
    }
    
    if (formattedPhone.startsWith('55') && formattedPhone.length !== 13) {
      return createResult(false, 'Número brasileiro deve ter 11 dígitos após código do país', {
        original: phoneNumber,
        cleaned: cleanPhone,
        formatted: formattedPhone
      });
    }
    
    return createResult(true, 'Número válido', {
      original: phoneNumber,
      cleaned: cleanPhone,
      formatted: formattedPhone
    });
  }, [createResult]);

  const testSendMessage = useCallback(async (config: Partial<WhatsAppConfig>, phoneNumber: string, message: string): Promise<DiagnosticResult> => {
    console.log('📤 Testando envio de mensagem...');
    
    const phoneValidation = testPhoneValidation(phoneNumber);
    if (!phoneValidation.success) {
      return phoneValidation;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-cloud-api', {
        body: {
          action: 'send_message',
          config,
          phoneNumber,
          message
        }
      });

      if (error) {
        return createResult(false, `Erro na função: ${error.message}`, { error });
      }

      if (data?.success) {
        return createResult(true, 'Mensagem enviada com sucesso', {
          messageId: data.messageId,
          phoneNumber: phoneValidation.details?.formatted
        });
      } else {
        return createResult(false, `Falha no envio: ${data?.error || 'Erro desconhecido'}`, data);
      }
    } catch (error) {
      return createResult(false, `Erro ao enviar mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { error });
    }
  }, [createResult, testPhoneValidation]);

  const runFullDiagnostic = useCallback(async (config: Partial<WhatsAppConfig>): Promise<DiagnosticResult[]> => {
    setIsRunning(true);
    console.log('🚀 Iniciando diagnóstico completo do WhatsApp...');
    
    const results: DiagnosticResult[] = [];
    
    try {
      // 1. Validar credenciais
      const credentialsResult = await validateCredentials(config);
      results.push(credentialsResult);
      
      if (!credentialsResult.success) {
        setLastResults(results);
        return results;
      }
      
      // 2. Testar conexão
      const connectionResult = await testConnection(config);
      results.push(connectionResult);
      
      // 3. Validar configuração geral
      const configResult = createResult(true, 'Diagnóstico concluído', {
        totalTests: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
      results.push(configResult);
      
      setLastResults(results);
      return results;
    } catch (error) {
      const errorResult = createResult(false, `Erro no diagnóstico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { error });
      results.push(errorResult);
      setLastResults(results);
      return results;
    } finally {
      setIsRunning(false);
    }
  }, [validateCredentials, testConnection, createResult]);

  const clearResults = useCallback(() => {
    setLastResults([]);
  }, []);

  return useMemo(() => ({
    isRunning,
    lastResults,
    runFullDiagnostic,
    testSendMessage,
    clearResults
  }), [isRunning, lastResults, runFullDiagnostic, testSendMessage, clearResults]);
};
