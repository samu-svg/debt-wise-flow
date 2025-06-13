
export interface WhatsAppConnection {
  isConnected: boolean;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  webhookToken?: string;
  lastSeen?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  retryCount: number;
  lastError?: string;
}

export interface WhatsAppLog {
  id: string;
  timestamp: string;
  type: 'connection' | 'message' | 'error' | 'system' | 'webhook';
  message: string;
  data?: any;
}

export interface WhatsAppMessage {
  id: string;
  clientId: string;
  phoneNumber: string;
  message: string;
  type: 'sent' | 'received';
  timestamp: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  messageId?: string;
}

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookToken: string;
  webhookUrl: string;
  messageDelay: number;
  businessHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  category: 'marketing' | 'utility' | 'authentication';
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'buttons';
    text?: string;
    parameters?: string[];
  }>;
}

export interface MessageTemplate {
  name: string;
  language: string;
  components: Array<{
    type: string;
    parameters?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}
