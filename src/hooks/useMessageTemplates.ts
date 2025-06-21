
import { useState } from 'react';
import { MessageTemplate } from '@/types/templates';

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'template-1',
    name: 'Cobrança Padrão',
    type: 'cobranca',
    subject: 'Cobrança Automática',
    content: 'Olá {nome}, sua dívida de R$ {valor} está vencida há {diasAtraso} dias. Total com juros: R$ {valorTotal}.',
    variables: [
      { name: 'nome', label: 'Nome do Cliente', type: 'text', required: true },
      { name: 'valor', label: 'Valor Original', type: 'currency', required: true },
      { name: 'diasAtraso', label: 'Dias em Atraso', type: 'number', required: true },
      { name: 'valorTotal', label: 'Valor Total', type: 'currency', required: true }
    ],
    autoResponses: [],
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const useMessageTemplates = () => {
  const [templates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);

  const calculateDebtValues = (originalValue: number, dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysOverdue = Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
    
    const fine = originalValue * 0.02; // 2% multa
    const interest = (originalValue * 0.01 * daysOverdue) / 30; // 1% ao mês
    const totalValue = originalValue + fine + interest;

    return {
      fine,
      interest,
      totalValue,
      daysOverdue
    };
  };

  const previewTemplate = (template: MessageTemplate, variables: Record<string, any>) => {
    let content = template.content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      content = content.replace(regex, String(value));
    });

    return content;
  };

  return {
    templates,
    calculateDebtValues,
    previewTemplate
  };
};
