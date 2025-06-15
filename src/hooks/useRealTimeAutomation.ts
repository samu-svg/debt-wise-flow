
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseData } from './useSupabaseData';
import { useWhatsAppCloudAPI } from './useWhatsAppCloudAPI';
import { useMessageTemplates } from './useMessageTemplates';
import { useCollectionAutomation } from './useCollectionAutomation';
import { toast } from '@/hooks/use-toast';

interface ProcessedDebt {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  lastProcessed?: string;
}

export const useRealTimeAutomation = () => {
  const { dividas, clientes, loading } = useSupabaseData();
  const { connection, sendMessage } = useWhatsAppCloudAPI();
  const { calculateDebtValues, previewTemplate, templates } = useMessageTemplates();
  const { config, canSendToClient, getMessageType, processClientResponse } = useCollectionAutomation();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedToday, setProcessedToday] = useState<ProcessedDebt[]>([]);

  // Identificar dívidas vencidas com dados do cliente
  const getOverdueDebtsWithClients = useCallback(() => {
    if (loading || !dividas || !clientes) return [];

    const today = new Date();
    const overdueDebts: ProcessedDebt[] = [];

    dividas.forEach(debt => {
      if (debt.status === 'pago') return;
      
      const dueDate = new Date(debt.data_vencimento || '');
      if (dueDate >= today) return;

      const client = clientes.find(c => c.id === debt.cliente_id);
      if (!client) return;

      const daysOverdue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      overdueDebts.push({
        id: debt.id,
        clientId: client.id,
        clientName: client.nome,
        amount: debt.valor,
        dueDate: debt.data_vencimento || '',
        daysOverdue
      });
    });

    return overdueDebts.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [dividas, clientes, loading]);

  // Processar cobrança para uma dívida específica
  const processDebtCollection = useCallback(async (debt: ProcessedDebt) => {
    if (!connection.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    // Verificar se pode enviar para este cliente
    const canSend = canSendToClient(debt.clientId, debt.id);
    if (!canSend.canSend) {
      console.log(`Não pode enviar para ${debt.clientName}: ${canSend.reason}`);
      return false;
    }

    // Determinar tipo de mensagem baseado nos dias de atraso
    const messageType = getMessageType(debt.daysOverdue);
    
    // Buscar template padrão de cobrança
    const template = templates.find(t => t.type === 'cobranca' && t.isActive);
    if (!template) {
      throw new Error('Template de cobrança não encontrado');
    }

    // Calcular valores da dívida
    const debtCalc = calculateDebtValues(debt.amount, debt.dueDate);
    
    // Preparar variáveis do template
    const templateVars = {
      nome: debt.clientName,
      valor: debt.amount.toFixed(2),
      dataVencimento: new Date(debt.dueDate).toLocaleDateString('pt-BR'),
      diasAtraso: debt.daysOverdue,
      multa: debtCalc.fine.toFixed(2),
      juros: debtCalc.interest.toFixed(2),
      valorTotal: debtCalc.totalValue.toFixed(2),
      chavePix: 'sua-chave-pix@empresa.com' // Configurável
    };

    // Gerar mensagem do template
    const message = previewTemplate(template, templateVars);

    // Buscar número do WhatsApp do cliente
    const client = clientes.find(c => c.id === debt.clientId);
    if (!client?.whatsapp) {
      throw new Error(`Cliente ${debt.clientName} não possui WhatsApp cadastrado`);
    }

    // Enviar mensagem
    try {
      const messageId = await sendMessage(client.whatsapp, message);
      
      // Marcar como processado hoje
      setProcessedToday(prev => [...prev, {
        ...debt,
        lastProcessed: new Date().toISOString()
      }]);

      console.log(`✅ Cobrança enviada para ${debt.clientName}: ${messageType}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao enviar para ${debt.clientName}:`, error);
      throw error;
    }
  }, [
    connection.isConnected,
    canSendToClient,
    getMessageType,
    templates,
    calculateDebtValues,
    previewTemplate,
    clientes,
    sendMessage
  ]);

  // Processar todas as cobranças automaticamente
  const processAllCollections = useCallback(async () => {
    if (!config.enabled || isProcessing) {
      return { processed: 0, errors: 0 };
    }

    setIsProcessing(true);
    let processed = 0;
    let errors = 0;

    try {
      const overdueDebts = getOverdueDebtsWithClients();
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Filtrar dívidas já processadas hoje
      const unprocessedDebts = overdueDebts.filter(debt => 
        !processedToday.some(p => 
          p.id === debt.id && 
          p.lastProcessed?.startsWith(todayStr)
        )
      );

      console.log(`🔍 Processando ${unprocessedDebts.length} dívidas vencidas...`);

      // Processar até o limite diário
      const maxToProcess = Math.min(
        unprocessedDebts.length, 
        config.maxMessagesPerDay - processedToday.filter(p => 
          p.lastProcessed?.startsWith(todayStr)
        ).length
      );

      for (let i = 0; i < maxToProcess; i++) {
        const debt = unprocessedDebts[i];
        
        try {
          const success = await processDebtCollection(debt);
          if (success) {
            processed++;
            
            // Delay entre mensagens para não sobrecarregar
            if (i < maxToProcess - 1) {
              await new Promise(resolve => 
                setTimeout(resolve, config.messageDelay || 2000)
              );
            }
          }
        } catch (error) {
          errors++;
          console.error(`Erro ao processar dívida ${debt.id}:`, error);
        }
      }

      toast({
        title: "Processamento concluído!",
        description: `${processed} mensagens enviadas, ${errors} erros`,
        variant: processed > 0 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Erro no processamento automático:', error);
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro durante o processamento automático",
        variant: "destructive"
      });
      errors++;
    } finally {
      setIsProcessing(false);
    }

    return { processed, errors };
  }, [
    config.enabled,
    config.maxMessagesPerDay,
    config.messageDelay,
    isProcessing,
    getOverdueDebtsWithClients,
    processedToday,
    processDebtCollection
  ]);

  // Auto-processamento em intervalos configurados
  useEffect(() => {
    if (!config.enabled) return;

    const checkAndProcess = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      
      // Verificar se é um horário configurado
      if (config.checkTimes.includes(currentTime)) {
        console.log(`⏰ Horário de verificação: ${currentTime}`);
        processAllCollections();
      }
    };

    // Verificar a cada minuto
    const interval = setInterval(checkAndProcess, 60000);
    
    return () => clearInterval(interval);
  }, [config.enabled, config.checkTimes, processAllCollections]);

  // Resetar processados diariamente
  useEffect(() => {
    const resetDaily = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setProcessedToday([]);
        console.log('🔄 Reset diário do processamento');
      }
    };

    const interval = setInterval(resetDaily, 60000);
    return () => clearInterval(interval);
  }, []);

  const overdueDebts = getOverdueDebtsWithClients();
  const todayProcessed = processedToday.filter(p => 
    p.lastProcessed?.startsWith(new Date().toISOString().split('T')[0])
  ).length;

  return {
    overdueDebts,
    processedToday: todayProcessed,
    isProcessing,
    processAllCollections,
    processDebtCollection,
    canProcessMore: todayProcessed < config.maxMessagesPerDay,
    remainingQuota: Math.max(0, config.maxMessagesPerDay - todayProcessed)
  };
};
