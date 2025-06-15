import { useState, useEffect, useCallback } from 'react';
import { useLocalDataManager } from './useLocalDataManager';
import { useNotifications } from './useNotifications';
import { dataValidationService, ValidationResult } from '@/services/DataValidationService';

export const useDataIntegrity = () => {
  const { database } = useLocalDataManager();
  const { notifyError, notifyWarning, notifySuccess, service: notificationService } = useNotifications();
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [autoValidationEnabled, setAutoValidationEnabled] = useState(true);
  const [lastValidation, setLastValidation] = useState<string | null>(null);

  // Validação automática
  const validateData = useCallback(async () => {
    if (!database || isValidating) return;

    setIsValidating(true);
    try {
      console.log('🔍 Validando integridade dos dados...');
      const result = await dataValidationService.validateData(database);
      setValidation(result);
      setLastValidation(new Date().toISOString());
      
      // Notificações baseadas no resultado
      if (!result.isValid) {
        const criticalErrors = result.errors.filter(e => e.severity === 'critical' || e.severity === 'high');
        
        if (criticalErrors.length > 0) {
          notificationService.notifyIntegrityIssue(
            'Problemas Críticos Detectados',
            `${criticalErrors.length} problema(s) crítico(s) encontrado(s) nos dados`,
            () => {
              // Ação para abrir painel de integridade
              console.log('Abrir painel de integridade');
            }
          );
        } else {
          notifyWarning(
            'Problemas de Integridade',
            `${result.errors.length} problema(s) encontrado(s)`,
            'integrity'
          );
        }
        
        console.warn('⚠️ Problemas de integridade encontrados:', result.errors);
      } else if (result.warnings.length > 0) {
        notifyWarning(
          'Avisos de Integridade',
          `${result.warnings.length} aviso(s) encontrado(s)`,
          'integrity'
        );
        console.warn('⚠️ Avisos de integridade:', result.warnings);
      } else {
        console.log('✅ Dados íntegros e válidos');
        // Só notificar sucesso em validações manuais para não spammar
        if (!autoValidationEnabled) {
          notifySuccess(
            'Dados Íntegros',
            'Todos os dados estão válidos e consistentes',
            'integrity'
          );
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro na validação de integridade:', error);
      notifyError(
        'Erro na Validação',
        'Falha ao validar integridade dos dados',
        'integrity'
      );
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [database, isValidating, autoValidationEnabled, notifyError, notifyWarning, notifySuccess, notificationService]);

  // Executar validação automática quando dados mudarem
  useEffect(() => {
    if (database && autoValidationEnabled && !isValidating) {
      const timer = setTimeout(() => {
        validateData();
      }, 1000); // Debounce de 1 segundo

      return () => clearTimeout(timer);
    }
  }, [database, autoValidationEnabled, validateData]);

  // Validação periódica (a cada 5 minutos)
  useEffect(() => {
    if (!autoValidationEnabled) return;

    const interval = setInterval(() => {
      if (database && !isValidating) {
        console.log('🔄 Validação periódica de integridade...');
        validateData();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [database, autoValidationEnabled, validateData]);

  // Função para reparar dados automaticamente
  const repairData = useCallback(async () => {
    if (!database || !validation || validation.errors.length === 0) {
      return false;
    }

    try {
      console.log('🔧 Iniciando reparo automático...');
      const repairedData = await dataValidationService.repairData(database, validation.errors);
      
      // Aqui você integraria com o sistema de salvamento
      console.log('✅ Dados reparados com sucesso');
      
      // Notificar sucesso do reparo
      notifySuccess(
        'Reparo Concluído',
        'Dados reparados automaticamente com sucesso',
        'integrity'
      );
      
      // Revalidar após reparo
      await validateData();
      return true;
    } catch (error) {
      console.error('❌ Erro no reparo automático:', error);
      notifyError(
        'Erro no Reparo',
        'Falha ao reparar dados automaticamente',
        'integrity'
      );
      return false;
    }
  }, [database, validation, validateData, notifySuccess, notifyError]);

  // Verificar se dados precisam de atenção urgente
  const needsAttention = validation && !validation.isValid && 
    validation.errors.some(e => e.severity === 'critical' || e.severity === 'high');

  // Estatísticas resumidas
  const stats = validation ? {
    totalIssues: validation.errors.length + validation.warnings.length,
    criticalIssues: validation.errors.filter(e => e.severity === 'critical').length,
    highIssues: validation.errors.filter(e => e.severity === 'high').length,
    warnings: validation.warnings.length,
    isHealthy: validation.isValid && validation.warnings.length === 0
  } : null;

  return {
    // Estado
    validation,
    isValidating,
    lastValidation,
    needsAttention,
    stats,

    // Controles
    validateData,
    repairData,
    autoValidationEnabled,
    setAutoValidationEnabled,

    // Utilitários
    isDataHealthy: validation?.isValid && validation.warnings.length === 0,
    hasErrors: validation && validation.errors.length > 0,
    hasWarnings: validation && validation.warnings.length > 0,
    canAutoRepair: validation && validation.errors.some(e => 
      e.type === 'reference' || e.type === 'duplicate'
    )
  };
};
