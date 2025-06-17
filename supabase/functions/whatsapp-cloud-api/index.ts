
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

function validateConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config?.accessToken) {
    errors.push('Access Token é obrigatório');
  } else if (!config.accessToken.startsWith('EAA')) {
    errors.push('Access Token deve começar com "EAA"');
  }
  
  if (!config?.phoneNumberId) {
    errors.push('Phone Number ID é obrigatório');
  } else if (!/^\d{15,20}$/.test(config.phoneNumberId)) {
    errors.push('Phone Number ID deve ter entre 15-20 dígitos');
  }
  
  if (!config?.businessAccountId) {
    errors.push('Business Account ID é obrigatório');
  } else if (!/^\d{15,20}$/.test(config.businessAccountId)) {
    errors.push('Business Account ID deve ter entre 15-20 dígitos');
  }
  
  return { valid: errors.length === 0, errors };
}

function validatePhoneNumber(phoneNumber: string): { valid: boolean; formatted: string; error?: string } {
  if (!phoneNumber) {
    return { valid: false, formatted: '', error: 'Número de telefone é obrigatório' };
  }
  
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanPhone.length < 10) {
    return { valid: false, formatted: '', error: 'Número muito curto' };
  }
  
  if (cleanPhone.length > 15) {
    return { valid: false, formatted: '', error: 'Número muito longo' };
  }
  
  let formattedPhone = cleanPhone;
  if (!formattedPhone.startsWith('55')) {
    formattedPhone = `55${formattedPhone}`;
  }
  
  // Validar formato brasileiro
  if (formattedPhone.startsWith('55') && formattedPhone.length !== 13) {
    return { valid: false, formatted: '', error: 'Número brasileiro deve ter 11 dígitos após o código do país' };
  }
  
  return { valid: true, formatted: formattedPhone };
}

async function logWebhookEvent(event: any, source: string = 'webhook'): Promise<void> {
  try {
    console.log(`[${source.toUpperCase()}] ${new Date().toISOString()}:`, JSON.stringify(event, null, 2));
  } catch (error) {
    console.error('Erro ao logar evento:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Handle webhook verification and events
    if (url.pathname.includes('/webhook')) {
      return await handleWebhook(req);
    }

    const body = await req.json().catch(() => ({}));
    const { action, config, phoneNumber, message, templateName } = body;

    if (!action) {
      return createErrorResponse('Ação não especificada');
    }

    // Validar configuração para ações que precisam
    if (['test_connection', 'send_message', 'get_templates'].includes(action)) {
      const validation = validateConfig(config);
      if (!validation.valid) {
        return createErrorResponse('Configuração inválida', { errors: validation.errors });
      }
    }

    switch (action) {
      case 'test_connection':
        return await testConnection(config);
      
      case 'send_message':
        return await sendMessage(config, phoneNumber, message, templateName);
      
      case 'get_templates':
        return await getTemplates(config);
      
      case 'validate_config':
        return await validateConfiguration(config);
      
      default:
        return createErrorResponse(`Ação não reconhecida: ${action}`);
    }
  } catch (error) {
    console.error('Erro na API:', error);
    await logWebhookEvent({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, 'error');
    return createErrorResponse(
      'Erro interno do servidor',
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
  }
});

async function validateConfiguration(config: any): Promise<Response> {
  try {
    const validation = validateConfig(config);
    
    if (!validation.valid) {
      return createErrorResponse('Configuração inválida', { errors: validation.errors });
    }
    
    // Test basic connectivity
    const testResult = await testConnection(config);
    const testData = await testResult.json();
    
    return createSuccessResponse({
      configValid: true,
      connectionTest: testData.success,
      validationErrors: [],
      recommendations: []
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro na validação';
    return createErrorResponse(message, error);
  }
}

async function testConnection(config: any): Promise<Response> {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${config.phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
      
      // Log specific error details
      await logWebhookEvent({ 
        action: 'test_connection_failed',
        status: response.status,
        error: errorData 
      }, 'api_error');
      
      return createErrorResponse(`Erro na API do WhatsApp: ${errorMessage}`, errorData);
    }

    const data = await response.json();
    
    await logWebhookEvent({ 
      action: 'test_connection_success',
      phoneNumber: data.display_phone_number,
      status: data.verified_name 
    }, 'connection');
    
    return createSuccessResponse({
      phoneNumber: data.display_phone_number,
      verifiedName: data.verified_name,
      status: data.quality_rating || 'unknown',
      businessAccountId: config.businessAccountId
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro de conexão';
    await logWebhookEvent({ action: 'test_connection_error', error: message }, 'error');
    return createErrorResponse(`Falha na conexão: ${message}`, error);
  }
}

async function sendMessage(config: any, phoneNumber: string, message: string, templateName?: string): Promise<Response> {
  try {
    if (!message && !templateName) {
      return createErrorResponse('Mensagem ou nome do template é obrigatório');
    }

    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      return createErrorResponse(`Número inválido: ${phoneValidation.error}`);
    }

    let messageData: any;

    if (templateName) {
      messageData = {
        messaging_product: "whatsapp",
        to: phoneValidation.formatted,
        type: "template",
        template: {
          name: templateName,
          language: { code: "pt_BR" }
        }
      };
    } else {
      // Validar tamanho da mensagem
      if (message.length > 4096) {
        return createErrorResponse('Mensagem muito longa (máximo 4096 caracteres)');
      }
      
      messageData = {
        messaging_product: "whatsapp",
        to: phoneValidation.formatted,
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
      
      await logWebhookEvent({ 
        action: 'send_message_failed',
        phoneNumber: phoneValidation.formatted,
        error: errorData 
      }, 'message_error');
      
      return createErrorResponse(`Erro ao enviar mensagem: ${errorMessage}`, errorData);
    }

    const data = await response.json();
    if (!data.messages?.[0]?.id) {
      return createErrorResponse('Resposta inválida da API do WhatsApp', data);
    }

    await logWebhookEvent({ 
      action: 'message_sent',
      messageId: data.messages[0].id,
      phoneNumber: phoneValidation.formatted,
      type: templateName ? 'template' : 'text'
    }, 'message');

    return createSuccessResponse(undefined, {
      messageId: data.messages[0].id,
      status: 'sent',
      phoneNumber: phoneValidation.formatted,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
    await logWebhookEvent({ action: 'send_message_error', error: message }, 'error');
    return createErrorResponse(message, error);
  }
}

async function getTemplates(config: any): Promise<Response> {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${config.businessAccountId}/message_templates?limit=100`, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      
      await logWebhookEvent({ 
        action: 'get_templates_failed',
        error: errorData 
      }, 'template_error');
      
      return createErrorResponse(`Erro ao buscar templates: ${errorMessage}`, errorData);
    }

    const data = await response.json();
    const templates = data.data || [];
    
    // Filter and enhance templates
    const processedTemplates = templates
      .filter((template: any) => template.status === 'APPROVED')
      .map((template: any) => ({
        id: template.id,
        name: template.name,
        language: template.language,
        status: template.status.toLowerCase(),
        category: template.category?.toLowerCase() || 'utility',
        components: template.components || []
      }));
    
    await logWebhookEvent({ 
      action: 'templates_loaded',
      count: processedTemplates.length,
      total: templates.length
    }, 'template');

    return createSuccessResponse(undefined, {
      templates: processedTemplates,
      total: templates.length,
      approved: processedTemplates.length
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar templates';
    await logWebhookEvent({ action: 'get_templates_error', error: message }, 'error');
    return createErrorResponse(message, error);
  }
}

async function handleWebhook(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    
    if (req.method === 'GET') {
      // Webhook verification
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      await logWebhookEvent({ 
        action: 'webhook_verification',
        mode,
        token: token ? 'provided' : 'missing',
        challenge: challenge ? 'provided' : 'missing'
      }, 'webhook');

      if (!mode || !token || !challenge) {
        return createErrorResponse('Parâmetros de verificação do webhook ausentes');
      }

      if (mode === 'subscribe' && token === 'whatsapp_webhook_token') {
        await logWebhookEvent({ action: 'webhook_verified' }, 'webhook');
        return new Response(challenge, { headers: corsHeaders });
      } else {
        await logWebhookEvent({ action: 'webhook_verification_failed', token }, 'webhook');
        return createErrorResponse('Token de verificação inválido');
      }
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      
      await logWebhookEvent({ 
        action: 'webhook_received',
        hasEntry: !!body.entry,
        entryCount: body.entry?.length || 0
      }, 'webhook');

      // Process webhook data
      if (body.entry && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          if (entry.changes && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              if (change.field === 'messages' && change.value) {
                await processMessageWebhook(change.value);
              }
            }
          }
        }
      }

      return createSuccessResponse();
    }

    return createErrorResponse(`Método ${req.method} não permitido para webhook`);

  } catch (error) {
    console.error('Erro no webhook:', error);
    await logWebhookEvent({ action: 'webhook_error', error: error instanceof Error ? error.message : 'Unknown error' }, 'webhook');
    const message = error instanceof Error ? error.message : 'Erro no webhook';
    return createErrorResponse(message, error);
  }
}

async function processMessageWebhook(value: any): Promise<void> {
  try {
    if (value.messages && Array.isArray(value.messages)) {
      for (const message of value.messages) {
        await logWebhookEvent({
          action: 'message_received',
          messageId: message.id,
          from: message.from,
          type: message.type,
          timestamp: message.timestamp
        }, 'webhook');
      }
    }
    
    if (value.statuses && Array.isArray(value.statuses)) {
      for (const status of value.statuses) {
        await logWebhookEvent({
          action: 'message_status_update',
          messageId: status.id,
          status: status.status,
          timestamp: status.timestamp
        }, 'webhook');
      }
    }
  } catch (error) {
    console.error('Erro ao processar webhook de mensagem:', error);
    await logWebhookEvent({ action: 'webhook_processing_error', error: error instanceof Error ? error.message : 'Unknown error' }, 'webhook');
  }
}
