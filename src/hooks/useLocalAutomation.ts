
import { useState, useEffect, useCallback } from 'react';
import { useAutomationData } from './useAutomationData';
import { useMessageTemplates } from './useMessageTemplates';
import { CommunicationLog, AutomationConfig, AutomationStats } from '@/types/automation';
import { toast } from '@/hooks/use-toast';

const DEFAULT_CONFIG: AutomationConfig = {
  enabled: false,
  checkTimes: ['09:00', '14:00'],
  workDays: [1, 2, 3, 4, 5],
  holidays: [],
  maxMessagesPerDay: 50,
  messageDelay: 2000,
  responseTimeout: 48 * 60 * 60 * 1000,
  escalation: {
    beforeDue: -3,
    onDue: 0,
    afterDue1: 1,
    afterDue7: 7,
    afterDue15: 15,
    afterDue30: 30
  },
  valueSegmentation: {
    lowValue: { min: 0, max: 100, frequency: 'weekly' },
    mediumValue: { min: 100, max: 1000, frequency: 'every3days' },
    highValue: { min: 1000, max: Infinity, frequency: 'daily' }
  }
};

export const useLocalAutomation = () => {
  const { database, addCollectionMessage, updateSettings } = useAutomationData();
  const { templates, calculateDebtValues, previewTemplate } = useMessageTemplates();

  const [config, setConfig] = useState<AutomationConfig>(DEFAULT_CONFIG);
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [stats, setStats] = useState<AutomationStats>({
    totalSent: 0,
    totalResponded: 0,
    responseRate: 0,
    averageResponseTime: 0,
    conversionsToday: 0,
    pendingConversations: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Carregar dados do Supabase
  useEffect(() => {
    if (database) {
      const localComms = database.collectionHistory.map((msg: any) => ({
        id: msg.id,
        clientId: msg.clientId,
        debtId: msg.debtId,
        messageType: 'cobranca_formal' as const,
        templateId: msg.templateUsado,
        status: msg.statusEntrega === 'enviada' ? 'enviado' as const :
                msg.statusEntrega === 'entregue' ? 'lido' as const :
                msg.statusEntrega === 'erro' ? 'erro' as const : 'enviado' as const,
        sentAt: msg.data,
        conversationState: 'AGUARDANDO' as const,
        retryCount: 0
      }));
      
      setCommunications(localComms);
      calculateStats(localComms);
    }
  }, [database]);

  const calculateStats = (comms: CommunicationLog[]) => {
    const totalSent = comms.length;
    const totalResponded = comms.filter(c => c.status === 'respondido').length;
    const responseRate = totalSent > 0 ? (totalResponded / totalSent) * 100 : 0;
    const pendingConversations = comms.filter(c => c.conversationState === 'AGUARDANDO').length;
    
    setStats({
      totalSent,
      totalResponded,
      responseRate,
      averageResponseTime: 0,
      conversionsToday: 0,
      pendingConversations
    });
  };

  // Verificar dívidas vencidas dos dados do Supabase
  const getOverdueDebts = useCallback(() => {
    if (!database) return [];
    
    const today = new Date();
    return database.debts.filter((debt: any) => {
      if (debt.status === 'pago') return false;
      const dueDate = new Date(debt.dataVencimento);
      return dueDate < today;
    });
  }, [database]);

  // Calcular dias de atraso
  const calculateDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Determinar tipo de mensagem baseado nos dias de atraso
  const getMessageType = (daysOverdue: number) => {
    if (daysOverdue <= config.escalation.beforeDue) return 'lembrete_amigavel';
    if (daysOverdue <= config.escalation.onDue) return 'urgencia_moderada';
    if (daysOverdue <= config.escalation.afterDue1) return 'tom_serio';
    if (daysOverdue <= config.escalation.afterDue7) return 'cobranca_formal';
    if (daysOverdue <= config.escalation.afterDue15) return 'ultimo_aviso';
    return 'ameaca_protesto';
  };

  // Verificar se pode enviar mensagem para cliente
  const canSendToClient = (clientId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const todayMessages = communications.filter(comm => 
      comm.clientId === clientId && 
      comm.sentAt.startsWith(today)
    ).length;

    if (todayMessages >= config.maxMessagesPerDay) {
      return { canSend: false, reason: 'Limite diário atingido' };
    }

    return { canSend: true, reason: '' };
  };

  // Processar cobranças automáticas (sem WhatsApp)
  const processAutomaticCollections = useCallback(async () => {
    if (!config.enabled || isProcessing || !database) {
      return;
    }

    setIsProcessing(true);
    let messagesSent = 0;

    try {
      const overdueDebts = getOverdueDebts();
      console.log(`🔍 Processando ${overdueDebts.length} dívidas vencidas...`);

      for (const debt of overdueDebts.slice(0, 10)) {
        const client = database.clients.find((c: any) => c.id === debt.clientId);
        if (!client) continue;

        const daysOverdue = calculateDaysOverdue(debt.dataVencimento);
        const messageType = getMessageType(daysOverdue);
        
        const canSend = canSendToClient(client.id);
        if (!canSend.canSend) {
          console.log(`Não pode enviar para ${client.nome}: ${canSend.reason}`);
          continue;
        }

        const template = templates.find(t => t.type === 'cobranca' && t.isActive);
        if (!template) {
          console.log('Template de cobrança não encontrado');
          continue;
        }

        const debtCalc = calculateDebtValues(debt.valor, debt.dataVencimento);
        
        const templateVars = {
          nome: client.nome,
          valor: debt.valor.toFixed(2),
          dataVencimento: new Date(debt.dataVencimento).toLocaleDateString('pt-BR'),
          diasAtraso: Math.max(0, daysOverdue),
          multa: debtCalc.fine.toFixed(2),
          juros: debtCalc.interest.toFixed(2),
          valorTotal: debtCalc.totalValue.toFixed(2),
          chavePix: 'sua-chave-pix@empresa.com'
        };

        const message = previewTemplate(template, templateVars);

        try {
          // Log da mensagem (sem envio real via WhatsApp)
          await addCollectionMessage({
            clientId: client.id,
            debtId: debt.id,
            data: new Date().toISOString(),
            tipoMensagem: messageType,
            statusEntrega: 'simulada',
            mensagem: message,
            templateUsado: template.id
          });

          console.log(`✅ Mensagem preparada para ${client.nome}: ${messageType}`);
          messagesSent++;
          
          if (messagesSent < 10) {
            await new Promise(resolve => setTimeout(resolve, config.messageDelay));
          }
        } catch (error) {
          console.error(`❌ Erro ao processar mensagem para ${client.nome}:`, error);
          
          await addCollectionMessage({
            clientId: client.id,
            debtId: debt.id,
            data: new Date().toISOString(),
            tipoMensagem: messageType,
            statusEntrega: 'erro',
            mensagem: message,
            templateUsado: template.id,
            erroDetalhes: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      toast({
        title: "Processamento concluído!",
        description: `${messagesSent} mensagens processadas (modo simulação)`,
        variant: messagesSent > 0 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('❌ Erro no processamento automático:', error);
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro durante o processamento automático",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    config,
    database,
    communications,
    templates,
    calculateDebtValues,
    previewTemplate,
    addCollectionMessage,
    getOverdueDebts,
    isProcessing
  ]);

  // Atualizar configuração
  const updateConfig = useCallback(async (newConfig: Partial<AutomationConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    if (updateSettings) {
      await updateSettings({
        automacaoAtiva: updatedConfig.enabled,
        diasAntesLembrete: Math.abs(updatedConfig.escalation.beforeDue),
        diasAposVencimento: [
          updatedConfig.escalation.afterDue1,
          updatedConfig.escalation.afterDue7,
          updatedConfig.escalation.afterDue15,
          updatedConfig.escalation.afterDue30
        ]
      });
    }
  }, [config, updateSettings]);

  // Auto-processamento em intervalos
  useEffect(() => {
    if (!config.enabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      
      if (config.checkTimes.includes(currentTime)) {
        console.log(`⏰ Horário de verificação: ${currentTime}`);
        processAutomaticCollections();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [config.enabled, config.checkTimes, processAutomaticCollections]);

  return {
    config,
    stats,
    communications,
    isProcessing,
    overdueDebts: getOverdueDebts(),
    updateConfig,
    processAutomaticCollections,
    canSendToClient,
    getMessageType,
    calculateDaysOverdue
  };
};
