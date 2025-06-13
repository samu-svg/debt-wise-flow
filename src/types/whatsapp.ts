
export interface WhatsAppConnection {
  isConnected: boolean;
  phoneNumber?: string;
  lastSeen?: string;
  qrCode?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  retryCount: number;
  lastError?: string;
}

export interface WhatsAppLog {
  id: string;
  timestamp: string;
  type: 'connection' | 'message' | 'error' | 'system';
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
}

export interface WhatsAppConfig {
  autoReconnect: boolean;
  retryInterval: number;
  maxRetries: number;
  messageDelay: number;
  businessHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}
