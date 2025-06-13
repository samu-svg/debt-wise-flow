
import { useState, useEffect, useCallback } from 'react';
import { MessageTemplate, TemplateVariable, AutoResponse } from '@/types/templates';

const STORAGE_KEY = 'whatsapp_templates';

const DEFAULT_COBRANCA_TEMPLATE: MessageTemplate = {
  id: 'template-cobranca-default',
  name: 'Cobrança Padrão',
  type: 'cobranca',
  subject: 'Cobrança Automática',
  content: `💰 COBRANÇA AUTOMÁTICA

Olá {nome}! 👋

Identificamos um débito em aberto:

📋 **Detalhes da Dívida:**
- Valor original: R$ {valor}
- Data vencimento: {dataVencimento}
- Dias em atraso: {diasAtraso}
- Multa (2%): R$ {multa}
- Juros (1%/dia): R$ {juros}
- **VALOR TOTAL: R$ {valorTotal}**

💳 **Pagamento PIX:**
Chave: {chavePix}
Valor exato: R$ {valorTotal}

📱 **Suas opções:**
1️⃣ Já pagou? → Digite "PAGUEI"
2️⃣ Quer negociar? → Digite "NEGOCIAR"  
3️⃣ Dúvidas? → Digite "AJUDA"

⏰ Aguardamos seu retorno!`,
  variables: [
    { name: 'nome', label: 'Nome do Cliente', type: 'text', required: true },
    { name: 'valor', label: 'Valor Original', type: 'currency', required: true },
    { name: 'dataVencimento', label: 'Data de Vencimento', type: 'date', required: true },
    { name: 'diasAtraso', label: 'Dias em Atraso', type: 'number', required: true },
    { name: 'multa', label: 'Valor da Multa', type: 'currency', required: true },
    { name: 'juros', label: 'Valor dos Juros', type: 'currency', required: true },
    { name: 'valorTotal', label: 'Valor Total', type: 'currency', required: true },
    { name: 'chavePix', label: 'Chave PIX', type: 'text', required: true }
  ],
  autoResponses: [
    {
      trigger: 'PAGUEI',
      response: 'Ótimo! 🎉 Envie o comprovante para confirmarmos o pagamento.',
      action: 'request_proof'
    },
    {
      trigger: 'NEGOCIAR',
      response: 'Vamos encontrar uma solução! 💬 Qual valor você consegue pagar? Ou prefere parcelar?',
      action: 'forward_to_support'
    },
    {
      trigger: 'AJUDA',
      response: 'Estamos aqui para ajudar! 📞 Fale com nosso atendimento: {telefoneSupporte}',
      action: 'forward_to_support'
    }
  ],
  isActive: true,
  createdAt: new Date().toISOString()
};

export const useMessageTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar templates salvos
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTemplates(JSON.parse(saved));
      } else {
        // Criar template padrão se não existir
        setTemplates([DEFAULT_COBRANCA_TEMPLATE]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_COBRANCA_TEMPLATE]));
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setTemplates([DEFAULT_COBRANCA_TEMPLATE]);
    }
  };

  const saveTemplates = (newTemplates: MessageTemplate[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  const createTemplate = useCallback((template: Omit<MessageTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: MessageTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);
    return newTemplate;
  }, [templates]);

  const updateTemplate = useCallback((id: string, updates: Partial<MessageTemplate>) => {
    const updatedTemplates = templates.map(template =>
      template.id === id ? { ...template, ...updates } : template
    );
    saveTemplates(updatedTemplates);
  }, [templates]);

  const deleteTemplate = useCallback((id: string) => {
    const updatedTemplates = templates.filter(template => template.id !== id);
    saveTemplates(updatedTemplates);
  }, [templates]);

  const previewTemplate = useCallback((template: MessageTemplate, variables: Record<string, any>) => {
    let content = template.content;
    
    // Substituir variáveis no conteúdo
    template.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || `{${variable.name}}`;
      const regex = new RegExp(`\\{${variable.name}\\}`, 'g');
      content = content.replace(regex, String(value));
    });

    return content;
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const calculateDebtValues = (originalValue: number, dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const fine = originalValue * 0.02; // 2% multa
    const interest = originalValue * 0.01 * daysOverdue; // 1% ao dia
    const totalValue = originalValue + fine + interest;

    return {
      fine,
      interest,
      totalValue,
      daysOverdue
    };
  };

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewTemplate,
    formatCurrency,
    formatDate,
    calculateDebtValues
  };
};
