
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, config, phoneNumber, message, templateName } = await req.json();

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
        return Response.json(
          { success: false, error: 'Ação não reconhecida' },
          { status: 400, headers: corsHeaders }
        );
    }
  } catch (error) {
    console.error('Erro na API:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

async function testConnection(config: any) {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${config.phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro na API');
    }

    const data = await response.json();
    return Response.json({
      success: true,
      data: {
        phoneNumber: data.display_phone_number,
        status: data.verified_name,
        quality: data.quality_rating
      }
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { headers: corsHeaders });
  }
}

async function sendMessage(config: any, phoneNumber: string, message: string, templateName?: string) {
  try {
    // Limpar número de telefone (remover caracteres não numéricos)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    let messageData: any;

    if (templateName) {
      // Enviar template aprovado
      messageData = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "pt_BR"
          }
        }
      };
    } else {
      // Enviar mensagem de texto simples
      messageData = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: message
        }
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
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao enviar mensagem');
    }

    const data = await response.json();
    return Response.json({
      success: true,
      messageId: data.messages[0].id,
      status: 'sent'
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { headers: corsHeaders });
  }
}

async function getTemplates(config: any) {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${config.businessAccountId}/message_templates`, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao buscar templates');
    }

    const data = await response.json();
    return Response.json({
      success: true,
      templates: data.data || []
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { headers: corsHeaders });
  }
}

async function handleWebhook(req: Request) {
  try {
    const url = new URL(req.url);
    
    if (req.method === 'GET') {
      // Verificação do webhook
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === 'whatsapp_webhook_token') {
        return new Response(challenge, { headers: corsHeaders });
      } else {
        return new Response('Forbidden', { status: 403, headers: corsHeaders });
      }
    }

    if (req.method === 'POST') {
      // Processar webhook de mensagens recebidas
      const body = await req.json();
      console.log('Webhook recebido:', JSON.stringify(body, null, 2));

      // Aqui você pode processar mensagens recebidas
      // e salvar no banco de dados ou enviar para o frontend

      return Response.json({ success: true }, { headers: corsHeaders });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500, headers: corsHeaders });
  }
}
