
export interface MessageTemplate {
  id: string;
  name: string;
  type: 'cobranca' | 'lembrete' | 'negociacao' | 'confirmacao';
  subject: string;
  content: string;
  variables: TemplateVariable[];
  autoResponses: AutoResponse[];
  isActive: boolean;
  createdAt: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency';
  required: boolean;
  defaultValue?: string;
}

export interface AutoResponse {
  trigger: string;
  response: string;
  action?: 'forward_to_support' | 'mark_as_paid' | 'request_proof';
}

export interface MessagePreview {
  templateId: string;
  content: string;
  variables: Record<string, any>;
}
