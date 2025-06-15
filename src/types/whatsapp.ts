
export interface WhatsAppConnection {
  readonly isConnected: boolean;
  readonly phoneNumberId?: string;
  readonly phoneNumber?: string; // Para compatibilidade com componentes existentes
  readonly businessAccountId?: string;
  readonly accessToken?: string;
  readonly webhookToken?: string;
  readonly lastSeen?: string;
  readonly status: 'disconnected' | 'connecting' | 'connected' | 'error';
  readonly retryCount: number;
  readonly lastError?: string;
  readonly qrCode?: string; // Para compatibilidade com componentes existentes
}

export interface WhatsAppLog {
  readonly id: string;
  readonly timestamp: string;
  readonly type: 'connection' | 'message' | 'error' | 'system' | 'webhook';
  readonly message: string;
  readonly data?: unknown;
}

export interface WhatsAppMessage {
  readonly id: string;
  readonly clientId: string;
  readonly phoneNumber: string;
  readonly message: string;
  readonly type: 'sent' | 'received';
  readonly timestamp: string;
  readonly status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  readonly messageId?: string;
}

export interface WhatsAppBusinessHours {
  readonly enabled: boolean;
  readonly start: string;
  readonly end: string;
}

export interface WhatsAppConfig {
  readonly accessToken: string;
  readonly phoneNumberId: string;
  readonly businessAccountId: string;
  readonly webhookToken: string;
  readonly webhookUrl: string;
  readonly messageDelay: number;
  // Propriedades para configurações avançadas (compatibilidade)
  readonly autoReconnect?: boolean;
  readonly retryInterval?: number;
  readonly maxRetries?: number;
  readonly businessHours: WhatsAppBusinessHours;
}

export interface WhatsAppTemplateComponent {
  readonly type: 'header' | 'body' | 'footer' | 'buttons';
  readonly text?: string;
  readonly parameters?: readonly string[];
}

export interface WhatsAppTemplate {
  readonly id: string;
  readonly name: string;
  readonly language: string;
  readonly status: 'approved' | 'pending' | 'rejected';
  readonly category: 'marketing' | 'utility' | 'authentication';
  readonly components: readonly WhatsAppTemplateComponent[];
}

export interface MessageTemplateParameter {
  readonly type: string;
  readonly text: string;
}

export interface MessageTemplateComponent {
  readonly type: string;
  readonly parameters?: readonly MessageTemplateParameter[];
}

export interface MessageTemplate {
  readonly name: string;
  readonly language: string;
  readonly components: readonly MessageTemplateComponent[];
}

// Tipos utilitários para melhor type safety
export type WhatsAppConnectionStatus = WhatsAppConnection['status'];
export type WhatsAppLogType = WhatsAppLog['type'];
export type WhatsAppMessageType = WhatsAppMessage['type'];
export type WhatsAppMessageStatus = WhatsAppMessage['status'];
export type WhatsAppTemplateStatus = WhatsAppTemplate['status'];
export type WhatsAppTemplateCategory = WhatsAppTemplate['category'];
