
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
}

interface SendMessageRequest {
  action: string;
  phoneNumber: string;
  message?: string;
  templateName?: string;
  config: WhatsAppConfig;
  userId?: string;
  clientId?: string;
  debtId?: string;
}

async function logToDatabase(
  userId: string, 
  level: 'info' | 'error' | 'warning' | 'debug',
  type: string,
  message: string,
  data?: any,
  sessionId?: string
) {
  try {
    await supabase
      .from('whatsapp_logs')
      .insert({
        user_id: userId,
        level,
        type,
        message,
        data: data ? JSON.stringify(data) : null,
        session_id: sessionId,
        function_name: 'whatsapp-cloud-api'
      });
  } catch (error) {
    console.error('Failed to log to database:', error);
  }
}

async function saveMessageToDatabase(
  userId: string,
  clientId: string,
  debtId: string | undefined,
  message: string,
  templateUsed: string,
  messageType: string,
  whatsappMessageId?: string,
  status: string = 'enviada',
  errorDetails?: string
) {
  try {
    const messageData = {
      user_id: userId,
      cliente_id: clientId,
      divida_id: debtId || null,
      mensagem_enviada: message,
      template_usado: templateUsed,
      tipo_mensagem: messageType,
      whatsapp_message_id: whatsappMessageId,
      status_entrega: status,
      erro_detalhes: errorDetails,
      enviado_em: new Date().toISOString()
    };

    const { error } = await supabase
      .from('mensagens_cobranca')
      .insert(messageData);

    if (error) {
      console.error('Error saving message to database:', error);
      await logToDatabase(userId, 'error', 'database_save', 'Failed to save message', { error, messageData });
    } else {
      await logToDatabase(userId, 'info', 'message_saved', 'Message saved to database', { messageId: whatsappMessageId });
    }
  } catch (error) {
    console.error('Failed to save message:', error);
    await logToDatabase(userId, 'error', 'database_error', 'Database save failed', { error });
  }
}

async function testConnection(config: WhatsAppConfig, userId: string): Promise<{ success: boolean; error?: string; phoneNumber?: string }> {
  try {
    await logToDatabase(userId, 'info', 'connection_test', 'Testing WhatsApp API connection');

    const response = await fetch(`https://graph.facebook.com/v17.0/${config.phoneNumberId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      await logToDatabase(userId, 'error', 'connection_test', 'Connection test failed', { status: response.status, error: errorData });
      return { success: false, error: `API Error: ${response.status} - ${errorData}` };
    }

    const data = await response.json();
    await logToDatabase(userId, 'info', 'connection_test', 'Connection test successful', { phoneNumber: data.display_phone_number });
    
    return { 
      success: true, 
      phoneNumber: data.display_phone_number 
    };
  } catch (error) {
    await logToDatabase(userId, 'error', 'connection_test', 'Connection test exception', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  phoneNumber: string,
  message: string,
  userId: string,
  templateName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    await logToDatabase(userId, 'info', 'message_send', 'Attempting to send message', { 
      phoneNumber: cleanPhone, 
      templateName,
      hasMessage: !!message 
    });

    const messageData = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'text',
      text: {
        body: message
      }
    };

    const response = await fetch(`https://graph.facebook.com/v17.0/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      await logToDatabase(userId, 'error', 'message_send', 'Message send failed', { 
        status: response.status, 
        error: responseData,
        phoneNumber: cleanPhone 
      });
      return { success: false, error: `API Error: ${response.status} - ${JSON.stringify(responseData)}` };
    }

    const messageId = responseData.messages?.[0]?.id;
    
    await logToDatabase(userId, 'info', 'message_send', 'Message sent successfully', { 
      messageId,
      phoneNumber: cleanPhone,
      templateName 
    });

    console.log(`[MESSAGE] ${new Date().toISOString()}: ${JSON.stringify({
      action: 'message_sent',
      messageId,
      phoneNumber: cleanPhone,
      type: templateName ? 'template' : 'text'
    })}`);

    return { success: true, messageId };
  } catch (error) {
    await logToDatabase(userId, 'error', 'message_send', 'Message send exception', { 
      error: error.message,
      phoneNumber 
    });
    return { success: false, error: error.message };
  }
}

async function loadTemplates(config: WhatsAppConfig, userId: string) {
  try {
    await logToDatabase(userId, 'info', 'templates_load', 'Loading WhatsApp templates');

    const response = await fetch(`https://graph.facebook.com/v17.0/${config.businessAccountId}/message_templates`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      await logToDatabase(userId, 'error', 'templates_load', 'Failed to load templates', { status: response.status, error: errorData });
      return { success: false, error: `API Error: ${response.status} - ${errorData}` };
    }

    const data = await response.json();
    await logToDatabase(userId, 'info', 'templates_load', 'Templates loaded successfully', { count: data.data?.length || 0 });
    
    return { success: true, templates: data.data || [] };
  } catch (error) {
    await logToDatabase(userId, 'error', 'templates_load', 'Templates load exception', { error: error.message });
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: SendMessageRequest = await req.json();
    const { action, config, phoneNumber, message, templateName, userId, clientId, debtId } = requestData;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await logToDatabase(userId, 'info', 'function_call', 'WhatsApp Cloud API function called', { action });

    switch (action) {
      case 'test_connection':
        const testResult = await testConnection(config, userId);
        return new Response(
          JSON.stringify(testResult),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'send_message':
        if (!phoneNumber || (!message && !templateName)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Phone number and message/template are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const sendResult = await sendWhatsAppMessage(config, phoneNumber, message || '', userId, templateName);
        
        // Save message to database if successful
        if (sendResult.success && clientId) {
          await saveMessageToDatabase(
            userId,
            clientId,
            debtId,
            message || '',
            templateName || 'direct_message',
            templateName ? 'template' : 'text',
            sendResult.messageId,
            'enviada'
          );
        } else if (!sendResult.success && clientId) {
          await saveMessageToDatabase(
            userId,
            clientId,
            debtId,
            message || '',
            templateName || 'direct_message',
            templateName ? 'template' : 'text',
            undefined,
            'erro',
            sendResult.error
          );
        }

        return new Response(
          JSON.stringify(sendResult),
          { status: sendResult.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'load_templates':
        const templatesResult = await loadTemplates(config, userId);
        return new Response(
          JSON.stringify(templatesResult),
          { status: templatesResult.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'webhook':
        // Process webhook data
        await logToDatabase(userId, 'info', 'webhook', 'Webhook received', requestData);
        
        return new Response(
          JSON.stringify({ success: true, message: 'Webhook processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        await logToDatabase(userId, 'warning', 'unknown_action', 'Unknown action received', { action });
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
