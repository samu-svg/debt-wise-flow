
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  [key: string]: unknown;
}

type ApiResponse<T = unknown> = ErrorResponse | SuccessResponse<T>;

function createErrorResponse(message: string, details?: unknown): Response {
  const response: ErrorResponse = { success: false, error: message };
  if (details) response.details = details;
  
  return Response.json(response, { 
    status: 400, 
    headers: corsHeaders 
  });
}

function createSuccessResponse<T>(data?: T, extra?: Record<string, unknown>): Response {
  const response: SuccessResponse<T> = { success: true };
  if (data !== undefined) response.data = data;
  if (extra) Object.assign(response, extra);
  
  return Response.json(response, { headers: corsHeaders });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, config, phoneNumber, message, templateName } = body;

    if (!action) {
      return createErrorResponse('Ação não especificada');
    }

    switch (action) {
      case 'test_connection':
        return await testConnection(config);
      
      case 'send_message':
        return await sendMessage(config, phoneNumber, message, templateName);
      
      case 'get_templates':
        return await getTemplates(config);
      
      case 'webhook':
        return await handleWebhook(req);
      
      default:
        return createErrorResponse(`Ação não reconhecida: ${action}`);
    }
  } catch (error) {
    console.error('Erro na API:', error);
    return createErrorResponse(
      'Erro interno do servidor',
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
  }
});

async function testConnection(config: any): Promise<Response> {
  try {
    if (!config?.accessToken) {
      return createErrorResponse('Access token é obrigatório');
    }
    
    if (!config?.phoneNumberId) {
      return createErrorResponse('Phone Number ID é obrigatório');
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${config.phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return createErrorResponse(`Erro na API do WhatsApp: ${errorMessage}`, errorData);
    }

    const data = await response.json();
    return createSuccessResponse({
      phoneNumber: data.display_phone_number,
      status: data.verified_name,
      quality: data.quality_rating
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro de conexão';
    return createErrorResponse(`Falha na conexão: ${message}`, error);
  }
}

async function sendMessage(config: any, phoneNumber: string, message: string, templateName?: string): Promise<Response> {
  try {
    if (!config?.accessToken || !config?.phoneNumberId) {
      return createErrorResponse('Configuração incompleta: access token e phone number ID são obrigatórios');
    }

    if (!phoneNumber) {
      return createErrorResponse('Número de telefone é obrigatório');
    }

    if (!message && !templateName) {
      return createErrorResponse('Mensagem ou nome do template é obrigatório');
    }

    // Limpar e formatar número de telefone
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return createErrorResponse('Número de telefone inválido');
    }
    
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    let messageData: any;

    if (templateName) {
      messageData = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "pt_BR" }
        }
      };
    } else {
      messageData = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: { body: message }
      };
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return createErrorResponse(`Erro ao enviar mensagem: ${errorMessage}`, errorData);
    }

    const data = await response.json();
    if (!data.messages?.[0]?.id) {
      return createErrorResponse('Resposta inválida da API do WhatsApp', data);
    }

    return createSuccessResponse(undefined, {
      messageId: data.messages[0].id,
      status: 'sent'
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
    return createErrorResponse(message, error);
  }
}

async function getTemplates(config: any): Promise<Response> {
  try {
    if (!config?.accessToken || !config?.businessAccountId) {
      return createErrorResponse('Access token e Business Account ID são obrigatórios');
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${config.businessAccountId}/message_templates`, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return createErrorResponse(`Erro ao buscar templates: ${errorMessage}`, errorData);
    }

    const data = await response.json();
    return createSuccessResponse(undefined, {
      templates: data.data || []
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar templates';
    return createErrorResponse(message, error);
  }
}

async function handleWebhook(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (!mode || !token || !challenge) {
        return createErrorResponse('Parâmetros de verificação do webhook ausentes');
      }

      if (mode === 'subscribe' && token === 'whatsapp_webhook_token') {
        return new Response(challenge, { headers: corsHeaders });
      } else {
        return createErrorResponse('Token de verificação inválido');
      }
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      console.log('Webhook recebido:', JSON.stringify(body, null, 2));

      // Processar webhook de mensagens recebidas
      // Aqui você pode implementar a lógica para processar mensagens

      return createSuccessResponse();
    }

    return createErrorResponse(`Método ${req.method} não permitido para webhook`);

  } catch (error) {
    console.error('Erro no webhook:', error);
    const message = error instanceof Error ? error.message : 'Erro no webhook';
    return createErrorResponse(message, error);
  }
}
