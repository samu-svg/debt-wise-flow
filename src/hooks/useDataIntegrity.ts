
import { useState, useEffect, useCallback } from 'react';
import { useLocalDataManager } from './useLocalDataManager';
import { dataValidationService, ValidationResult } from '@/services/DataValidationService';

export const useDataIntegrity = () => {
  const { database } = useLocalDataManager();
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
      
      // Log de resultados
      if (!result.isValid) {
        console.warn('⚠️ Problemas de integridade encontrados:', result.errors);
      } else if (result.warnings.length > 0) {
        console.warn('⚠️ Avisos de integridade:', result.warnings);
      } else {
        console.log('✅ Dados íntegros e válidos');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro na validação de integridade:', error);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [database, isValidating]);

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
      
      // Revalidar após reparo
      await validateData();
      return true;
    } catch (error) {
      console.error('❌ Erro no reparo automático:', error);
      return false;
    }
  }, [database, validation, validateData]);

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
