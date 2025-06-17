
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
}

interface SendMessageRequest {
  action: string;
  phoneNumber?: string;
  message?: string;
  templateName?: string;
  messageId?: string;
  config?: WhatsAppConfig;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: SendMessageRequest = await req.json();
    const { action, phoneNumber, message, templateName, messageId } = requestData;

    console.log(`🚀 Ação recebida: ${action} {
  hasConfig: ${!!requestData.config},
  phoneNumber: "${phoneNumber?.substring(0, 5)}...",
  messageLength: ${message?.length},
  templateName: ${templateName}
}`);

    // Buscar credenciais do usuário no banco
    const { data: credentials, error: credError } = await supabase
      .from('whatsapp_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Credenciais não encontradas. Configure suas credenciais primeiro.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config: WhatsAppConfig = {
      accessToken: credentials.access_token_encrypted,
      phoneNumberId: credentials.phone_number_id,
      businessAccountId: credentials.business_account_id
    };

    if (action === 'test_connection') {
      return await handleTestConnection(config, supabase, user.id);
    }

    if (action === 'send_message') {
      return await handleSendMessage(config, phoneNumber!, message!, templateName, messageId, supabase, user.id);
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Ação não reconhecida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleTestConnection(config: WhatsAppConfig, supabase: any, userId: string) {
  console.log('🔗 Testando conexão com WhatsApp API...');
  const startTime = Date.now();

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phoneNumberId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Tempo de resposta: ${responseTime}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro na API:', errorData);
      
      // Atualizar status no banco
      await supabase
        .from('whatsapp_credentials')
        .update({ 
          health_status: 'unhealthy',
          last_health_check: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      return new Response(
        JSON.stringify({
          success: false,
          error: errorData.error?.message || 'Erro na conexão',
          responseTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Atualizar status no banco
    await supabase
      .from('whatsapp_credentials')
      .update({ 
        health_status: 'healthy',
        last_health_check: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Log de sucesso
    await supabase.from('whatsapp_logs').insert({
      user_id: userId,
      type: 'connection',
      level: 'info',
      message: 'Teste de conexão realizado com sucesso',
      function_name: 'whatsapp-cloud-api',
      data: {
        action: 'test_connection_success',
        phoneNumber: data.display_phone_number,
        status: data.verified_name,
        responseTime
      }
    });

    console.log(`✅ Conexão estabelecida com sucesso: {
  phoneNumber: "${data.display_phone_number}",
  verifiedName: "${data.verified_name}",
  responseTime: "${responseTime}ms"
}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          phoneNumber: data.display_phone_number,
          verifiedName: data.verified_name,
          status: 'connected'
        },
        responseTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    
    // Atualizar status no banco
    await supabase
      .from('whatsapp_credentials')
      .update({ 
        health_status: 'unhealthy',
        last_health_check: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro na conexão'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleSendMessage(
  config: WhatsAppConfig, 
  phoneNumber: string, 
  message: string, 
  templateName: string | undefined, 
  messageId: string | undefined,
  supabase: any,
  userId: string
) {
  console.log(`📤 Iniciando envio de mensagem... {
  phoneNumber: "${phoneNumber.substring(0, 5)}...",
  messageLength: ${message.length},
  templateName: ${templateName}
}`);

  // Verificar se o número está na allowlist
  if (messageId) {
    const phoneClean = phoneNumber.replace(/\D/g, '');
    const { data: allowlistEntry } = await supabase
      .from('whatsapp_allowlist')
      .select('*')
      .eq('user_id', userId)
      .eq('phone_number', phoneClean)
      .eq('is_active', true)
      .single();

    if (!allowlistEntry) {
      const errorMsg = `Número ${phoneNumber} não está na lista de números aprovados`;
      console.error(`❌ ${errorMsg}`);
      
      // Log do erro
      await supabase.from('whatsapp_logs').insert({
        user_id: userId,
        type: 'error',
        level: 'error',
        message: errorMsg,
        function_name: 'whatsapp-cloud-api',
        data: {
          action: 'send_message_failed',
          phoneNumber: phoneClean,
          error: 'Number not in allowlist',
          messageId
        }
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg,
          errorCode: 'NOT_IN_ALLOWLIST'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Validar e formatar número
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  let formattedPhone = cleanPhone;
  
  if (!formattedPhone.startsWith('55')) {
    formattedPhone = `55${formattedPhone}`;
  }

  console.log(`📞 Número validado: ${formattedPhone}`);

  const startTime = Date.now();

  try {
    // Preparar payload para WhatsApp
    console.log('💬 Preparando mensagem de texto');
    
    const messagePayload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: {
        body: message
      }
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Tempo de envio: ${responseTime}ms`);

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`❌ Falha no envio: ${responseData.error?.message || 'Erro desconhecido'}`);
      
      // Log do erro
      await supabase.from('whatsapp_logs').insert({
        user_id: userId,
        type: 'error',
        level: 'error',
        message: `Falha no envio de mensagem: ${responseData.error?.message}`,
        function_name: 'whatsapp-cloud-api',
        data: {
          action: 'send_message_failed',
          phoneNumber: formattedPhone,
          error: responseData,
          responseTime,
          messageId
        }
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: responseData.error?.message || 'Erro no envio',
          errorCode: responseData.error?.code,
          responseTime
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whatsappMessageId = responseData.messages?.[0]?.id;

    // Atualizar mensagem no banco se temos o ID
    if (messageId && whatsappMessageId) {
      await supabase
        .from('whatsapp_messages')
        .update({
          whatsapp_message_id: whatsappMessageId,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', messageId);
    }

    // Log de sucesso
    await supabase.from('whatsapp_logs').insert({
      user_id: userId,
      type: 'message',
      level: 'info',
      message: 'Mensagem enviada com sucesso',
      function_name: 'whatsapp-cloud-api',
      data: {
        action: 'message_sent',
        messageId: whatsappMessageId,
        phoneNumber: formattedPhone,
        type: templateName ? 'template' : 'text',
        responseTime,
        localMessageId: messageId
      }
    });

    console.log(`✅ Mensagem enviada com sucesso: {
  messageId: "${whatsappMessageId}",
  phoneNumber: "${formattedPhone}",
  type: "${templateName ? 'template' : 'text'}",
  responseTime: "${responseTime}ms"
}`);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: whatsappMessageId,
        phoneNumber: formattedPhone,
        responseTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Erro no envio:', error);
    
    // Log do erro
    await supabase.from('whatsapp_logs').insert({
      user_id: userId,
      type: 'error',
      level: 'error',
      message: `Erro no envio de mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      function_name: 'whatsapp-cloud-api',
      data: {
        action: 'send_message_error',
        phoneNumber: formattedPhone,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        responseTime,
        messageId
      }
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro no envio'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
