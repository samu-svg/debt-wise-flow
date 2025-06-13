

export interface CommunicationLog {
  id: string;
  clientId: string;
  debtId: string;
  messageType: 'lembrete_amigavel' | 'urgencia_moderada' | 'tom_serio' | 'cobranca_formal' | 'ultimo_aviso' | 'ameaca_protesto';
  templateId: string;
  status: 'enviado' | 'lido' | 'respondido' | 'erro';
  sentAt: string;
  readAt?: string;
  responseAt?: string;
  clientResponse?: string;
  conversationState: 'AGUARDANDO' | 'NEGOCIANDO' | 'COMPROVANTE' | 'FINALIZADO';
  retryCount: number;
  nextRetryAt?: string;
}

export interface AutomationConfig {
  enabled: boolean;
  checkTimes: string[]; // ['09:00', '14:00']
  workDays: number[]; // [1,2,3,4,5] - Segunda a Sexta
  holidays: string[]; // ['2024-12-25', '2024-01-01']
  maxMessagesPerDay: number;
  responseTimeout: number; // 48 horas em ms
  
  // Escalonamento por dias de atraso
  escalation: {
    beforeDue: number; // -3 dias (lembrete amigável)
    onDue: number; // 0 dias (urgência moderada)
    afterDue1: number; // 1 dia (tom sério)
    afterDue7: number; // 7 dias (cobrança formal)
    afterDue15: number; // 15 dias (último aviso)
    afterDue30: number; // 30+ dias (ameaça protesto)
  };
  
  // Configurações por valor
  valueSegmentation: {
    lowValue: { min: number; max: number; frequency: 'weekly' };
    mediumValue: { min: number; max: number; frequency: 'every3days' };
    highValue: { min: number; max: number; frequency: 'daily' };
  };
}

export interface ClientSettings {
  clientId: string;
  customSchedule?: {
    enabled: boolean;
    preferredTimes: string[];
    blackoutPeriods: Array<{
      start: string;
      end: string;
      reason: string;
    }>;
  };
  isBlacklisted: boolean;
  blacklistReason?: string;
  preferredPixKey?: string;
  maxDailyMessages: number;
  lastContactAt?: string;
}

export interface AutomationStats {
  totalSent: number;
  totalResponded: number;
  responseRate: number;
  averageResponseTime: number;
  conversionsToday: number;
  pendingConversations: number;
}

