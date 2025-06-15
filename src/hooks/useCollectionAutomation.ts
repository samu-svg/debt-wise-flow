import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { useMessageTemplates } from './useMessageTemplates';
import { CommunicationLog, AutomationConfig, ClientSettings, AutomationStats } from '@/types/automation';

const STORAGE_KEYS = {
  COMMUNICATIONS: 'whatsapp_communications',
  AUTOMATION_CONFIG: 'automation_config',
  CLIENT_SETTINGS: 'client_settings',
  AUTOMATION_STATS: 'automation_stats'
};

const DEFAULT_CONFIG: AutomationConfig = {
  enabled: false,
  checkTimes: ['09:00', '14:00'],
  workDays: [1, 2, 3, 4, 5], // Segunda a Sexta
  holidays: [],
  maxMessagesPerDay: 50,
  responseTimeout: 48 * 60 * 60 * 1000, // 48 horas
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

export const useCollectionAutomation = () => {
  const { dividas, clientes } = useSupabaseData();
  const { connection, sendMessage } = useWhatsAppCloudAPI();
  const { templates, calculateDebtValues, previewTemplate } = useMessageTemplates();

  // Função de log local
  const addLog = useCallback((type: string, message: string, data?: any) => {
    console.log(`[${type.toUpperCase()}] ${message}`, data);
  }, []);

  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [config, setConfig] = useState<AutomationConfig>(DEFAULT_CONFIG);
  const [clientSettings, setClientSettings] = useState<ClientSettings[]>([]);
  const [stats, setStats] = useState<AutomationStats>({
    totalSent: 0,
    totalResponded: 0,
    responseRate: 0,
    averageResponseTime: 0,
    conversionsToday: 0,
    pendingConversations: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Carregar dados salvos
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = () => {
    try {
      const savedComm = localStorage.getItem(STORAGE_KEYS.COMMUNICATIONS);
      const savedConfig = localStorage.getItem(STORAGE_KEYS.AUTOMATION_CONFIG);
      const savedSettings = localStorage.getItem(STORAGE_KEYS.CLIENT_SETTINGS);
      const savedStats = localStorage.getItem(STORAGE_KEYS.AUTOMATION_STATS);

      if (savedComm) setCommunications(JSON.parse(savedComm));
      if (savedConfig) setConfig(JSON.parse(savedConfig));
      if (savedSettings) setClientSettings(JSON.parse(savedSettings));
      if (savedStats) setStats(JSON.parse(savedStats));
    } catch (error) {
      console.error('Erro ao carregar dados de automação:', error);
    }
  };

  const saveCommunications = (newComms: CommunicationLog[]) => {
    localStorage.setItem(STORAGE_KEYS.COMMUNICATIONS, JSON.stringify(newComms));
    setCommunications(newComms);
  };

  const saveConfig = (newConfig: AutomationConfig) => {
    localStorage.setItem(STORAGE_KEYS.AUTOMATION_CONFIG, JSON.stringify(newConfig));
    setConfig(newConfig);
  };

  const saveClientSettings = (newSettings: ClientSettings[]) => {
    localStorage.setItem(STORAGE_KEYS.CLIENT_SETTINGS, JSON.stringify(newSettings));
    setClientSettings(newSettings);
  };

  const saveStats = (newStats: AutomationStats) => {
    localStorage.setItem(STORAGE_KEYS.AUTOMATION_STATS, JSON.stringify(newStats));
    setStats(newStats);
  };

  // Verificar se é dia útil
  const isWorkDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    return config.workDays.includes(dayOfWeek);
  };

  // Verificar se é feriado
  const isHoliday = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return config.holidays.includes(dateStr);
  };

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

  // Verificar se cliente pode receber mensagem
  const canSendToClient = (clientId: string, debtId: string) => {
    const clientConfig = clientSettings.find(cs => cs.clientId === clientId);
    
    // Verificar blacklist
    if (clientConfig?.isBlacklisted) {
      return { canSend: false, reason: 'Cliente na blacklist' };
    }

    // Verificar limite diário
    const today = new Date().toISOString().split('T')[0];
    const todayMessages = communications.filter(comm => 
      comm.clientId === clientId && 
      comm.sentAt.startsWith(today)
    ).length;

    const maxDaily = clientConfig?.maxDailyMessages || config.maxMessagesPerDay;
    if (todayMessages >= maxDaily) {
      return { canSend: false, reason: 'Limite diário atingido' };
    }

    // Verificar última mensagem (mínimo 1 por dia)
    const lastMessage = communications
      .filter(comm => comm.clientId === clientId && comm.debtId === debtId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];

    if (lastMessage) {
      const lastSent = new Date(lastMessage.sentAt);
      const now = new Date();
      const hoursSinceLastMessage = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastMessage < 24) {
        return { canSend: false, reason: 'Mensagem já enviada hoje' };
      }
    }

    return { canSend: true, reason: '' };
  };

  // Processar cobranças automáticas - CONECTADO COM DADOS REAIS
  const processAutomaticCollections = useCallback(async () => {
    if (!config.enabled || !connection.isConnected || isProcessing) {
      return;
    }

    setIsProcessing(true);
    addLog('system', 'Iniciando processamento automático de cobranças...');

    try {
      const now = new Date();
      
      // Verificar se é hora de processar
      if (!isWorkDay(now) || isHoliday(now)) {
        addLog('system', 'Fora do horário de trabalho - processamento cancelado');
        return;
      }

      let messagesSent = 0;
      const todayStr = now.toISOString().split('T')[0];
      const todayMessages = communications.filter(comm => 
        comm.sentAt.startsWith(todayStr)
      ).length;

      if (todayMessages >= config.maxMessagesPerDay) {
        addLog('system', 'Limite diário de mensagens atingido');
        return;
      }

      // Processar dívidas vencidas do Supabase
      const overdueDebts = dividas.filter(debt => {
        if (debt.status === 'pago') return false;
        const dueDate = new Date(debt.data_vencimento || '');
        return dueDate < now;
      });

      addLog('system', `Encontradas ${overdueDebts.length} dívidas vencidas`);

      // Processar cada dívida vencida
      for (const debt of overdueDebts) {
        const client = clientes.find(c => c.id === debt.cliente_id);
        if (!client) continue;

        const daysOverdue = calculateDaysOverdue(debt.data_vencimento || '');
        const messageType = getMessageType(daysOverdue);
        
        // Verificar se pode enviar para este cliente
        const canSend = canSendToClient(client.id, debt.id);
        if (!canSend.canSend) {
          console.log(`Não pode enviar para ${client.nome}: ${canSend.reason}`);
          continue;
        }

        // Buscar template de cobrança
        const template = templates.find(t => t.type === 'cobranca' && t.isActive);
        if (!template) {
          addLog('error', 'Template de cobrança não encontrado');
          continue;
        }

        // Calcular valores da dívida
        const debtCalc = calculateDebtValues(debt.valor, debt.data_vencimento || '');
        
        // Preparar variáveis do template
        const templateVars = {
          nome: client.nome,
          valor: debt.valor.toFixed(2),
          dataVencimento: new Date(debt.data_vencimento || '').toLocaleDateString('pt-BR'),
          diasAtraso: Math.max(0, daysOverdue),
          multa: debtCalc.fine.toFixed(2),
          juros: debtCalc.interest.toFixed(2),
          valorTotal: debtCalc.totalValue.toFixed(2),
          chavePix: 'sua-chave-pix@empresa.com'
        };

        // Gerar mensagem
        const message = previewTemplate(template, templateVars);

        try {
          // ENVIAR MENSAGEM REAL via WhatsApp
          if (client.whatsapp) {
            await sendMessage(client.whatsapp, message);
            
            // Criar comunicação
            const communication: CommunicationLog = {
              id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              clientId: client.id,
              debtId: debt.id,
              messageType,
              templateId: template.id,
              status: 'enviado',
              sentAt: now.toISOString(),
              conversationState: 'AGUARDANDO',
              retryCount: 0,
              nextRetryAt: new Date(now.getTime() + config.responseTimeout).toISOString()
            };

            // Adicionar à lista de comunicações
            saveCommunications([...communications, communication]);
            
            addLog('message', `Cobrança enviada para ${client.nome}`, {
              messageType,
              daysOverdue,
              amount: debtCalc.totalValue
            });

            messagesSent++;
            
            // Delay entre mensagens
            if (messagesSent < 10) {
              await new Promise(resolve => setTimeout(resolve, config.messageDelay || 2000));
            }
          }
        } catch (error) {
          addLog('error', `Erro ao enviar mensagem para ${client.nome}`, { error });
        }

        // Limite de segurança
        if (messagesSent >= 10) break;
      }

      // Atualizar estatísticas
      const newStats = {
        ...stats,
        totalSent: stats.totalSent + messagesSent,
        pendingConversations: communications.filter(c => c.conversationState === 'AGUARDANDO').length
      };
      saveStats(newStats);

      addLog('system', `Processamento concluído. ${messagesSent} mensagens enviadas.`);

    } catch (error) {
      addLog('error', 'Erro no processamento automático', { error });
      console.error('Erro no processamento automático:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    config, 
    connection, 
    dividas, 
    clientes, 
    communications, 
    stats, 
    templates,
    sendMessage,
    calculateDebtValues,
    previewTemplate,
    addLog, 
    isProcessing
  ]);

  // Processar resposta do cliente
  const processClientResponse = useCallback((clientId: string, response: string) => {
    const activeComm = communications.find(comm => 
      comm.clientId === clientId && 
      comm.conversationState === 'AGUARDANDO'
    );

    if (!activeComm) return;

    const updatedComm = {
      ...activeComm,
      status: 'respondido' as const,
      responseAt: new Date().toISOString(),
      clientResponse: response,
      conversationState: response.toUpperCase().includes('PAGUEI') ? 'COMPROVANTE' as const :
                        response.toUpperCase().includes('NEGOCIAR') ? 'NEGOCIANDO' as const :
                        'AGUARDANDO' as const
    };

    const updatedComms = communications.map(comm => 
      comm.id === activeComm.id ? updatedComm : comm
    );

    saveCommunications(updatedComms);
    
    addLog('message', `Resposta recebida de cliente ${clientId}`, {
      response,
      newState: updatedComm.conversationState
    });
  }, [communications, addLog]);

  // Auto-executar processamento em intervalos
  useEffect(() => {
    if (!config.enabled) return;

    const interval = setInterval(() => {
      processAutomaticCollections();
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [config.enabled, processAutomaticCollections]);

  return {
    communications,
    config,
    clientSettings,
    stats,
    isProcessing,
    updateConfig: saveConfig,
    updateClientSettings: saveClientSettings,
    processAutomaticCollections,
    processClientResponse,
    canSendToClient,
    getMessageType,
    calculateDaysOverdue
  };
};
