
import { useState, useEffect } from 'react';
import { useDataManager } from './useDataManager';

export interface IntegrityReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalRecords: number;
}

export const useDataIntegrity = () => {
  const { clients, debts, loading } = useDataManager();
  const [report, setReport] = useState<IntegrityReport>({
    isValid: true,
    errors: [],
    warnings: [],
    totalRecords: 0
  });

  const validateData = () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar clientes
    clients.forEach(client => {
      if (!client.nome || client.nome.trim() === '') {
        errors.push(`Cliente ${client.id} sem nome`);
      }
      if (!client.whatsapp || client.whatsapp.trim() === '') {
        warnings.push(`Cliente ${client.nome} sem WhatsApp`);
      }
    });

    // Validar dívidas
    debts.forEach(debt => {
      if (!debt.descricao || debt.descricao.trim() === '') {
        warnings.push(`Dívida ${debt.id} sem descrição`);
      }
      if (debt.valor <= 0) {
        errors.push(`Dívida ${debt.id} com valor inválido`);
      }
      // Verificar se cliente existe
      const clientExists = clients.some(client => client.id === debt.cliente_id);
      if (!clientExists) {
        errors.push(`Dívida ${debt.id} referencia cliente inexistente`);
      }
    });

    setReport({
      isValid: errors.length === 0,
      errors,
      warnings,
      totalRecords: clients.length + debts.length
    });
  };

  useEffect(() => {
    if (!loading) {
      validateData();
    }
  }, [clients, debts, loading]);

  return {
    report,
    validateData,
    loading
  };
};
