
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Cliente {
  id: string
  nome: string
  whatsapp: string
  valor_divida: number
  data_vencimento: string
  status: string
  user_id: string
}

interface Template {
  id: string
  tipo: string
  template: string
  ativo: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Iniciando processo de cobrança automática...')

    // Buscar todos os clientes que precisam receber mensagens hoje
    const hoje = new Date().toISOString().split('T')[0]
    const tresDiasAntes = new Date()
    tresDiasAntes.setDate(tresDiasAntes.getDate() + 3)
    const tresDiasAntesStr = tresDiasAntes.toISOString().split('T')[0]

    const umDiaAtras = new Date()
    umDiaAtras.setDate(umDiaAtras.getDate() - 1)
    const umDiaAtrasStr = umDiaAtras.toISOString().split('T')[0]

    const seteDiasAtras = new Date()
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
    const seteDiasAtrasStr = seteDiasAtras.toISOString().split('T')[0]

    console.log(`📅 Buscando clientes para datas:`)
    console.log(`- 3 dias antes: ${tresDiasAntesStr}`)
    console.log(`- Vencimento hoje: ${hoje}`)
    console.log(`- 1 dia atraso: ${umDiaAtrasStr}`)
    console.log(`- 7 dias atraso: ${seteDiasAtrasStr}`)

    // Buscar clientes por categorias
    const { data: clientes, error: clientesError } = await supabaseClient
      .from('clientes_cobranca')
      .select('*')
      .in('data_vencimento', [tresDiasAntesStr, hoje, umDiaAtrasStr, seteDiasAtrasStr])
      .eq('status', 'pendente')

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError)
      throw clientesError
    }

    console.log(`👥 Encontrados ${clientes?.length || 0} clientes para processar`)

    const processResults = []

    for (const cliente of clientes || []) {
      try {
        // Determinar tipo de mensagem baseado na data
        let tipoMensagem = ''
        let diasAtraso = 0

        if (cliente.data_vencimento === tresDiasAntesStr) {
          tipoMensagem = '3_dias_antes'
        } else if (cliente.data_vencimento === hoje) {
          tipoMensagem = 'vencimento'
        } else if (cliente.data_vencimento === umDiaAtrasStr) {
          tipoMensagem = '1_dia_atraso'
          diasAtraso = 1
        } else if (cliente.data_vencimento === seteDiasAtrasStr) {
          tipoMensagem = '7_dias_atraso'
          diasAtraso = 7
        }

        console.log(`📝 Processando cliente ${cliente.nome} - Tipo: ${tipoMensagem}`)

        // Verificar se já enviou mensagem deste tipo hoje
        const { data: mensagemExistente } = await supabaseClient
          .from('mensagens_cobranca')
          .select('id')
          .eq('cliente_id', cliente.id)
          .eq('tipo_mensagem', tipoMensagem)
          .gte('enviado_em', new Date().toISOString().split('T')[0])
          .single()

        if (mensagemExistente) {
          console.log(`⏭️ Mensagem já enviada hoje para ${cliente.nome}`)
          continue
        }

        // Buscar template ativo para este tipo
        const { data: template, error: templateError } = await supabaseClient
          .from('templates_cobranca')
          .select('*')
          .eq('user_id', cliente.user_id)
          .eq('tipo', tipoMensagem)
          .eq('ativo', true)
          .single()

        if (templateError || !template) {
          console.log(`⚠️ Template não encontrado para ${tipoMensagem}`)
          continue
        }

        // Substituir variáveis no template
        let mensagem = template.template
        mensagem = mensagem.replace(/{{nome}}/g, cliente.nome)
        mensagem = mensagem.replace(/{{valor}}/g, cliente.valor_divida.toFixed(2))
        mensagem = mensagem.replace(/{{data}}/g, new Date(cliente.data_vencimento).toLocaleDateString('pt-BR'))
        if (diasAtraso > 0) {
          mensagem = mensagem.replace(/{{dias}}/g, diasAtraso.toString())
        }

        console.log(`💬 Mensagem preparada: ${mensagem.substring(0, 50)}...`)

        // Simular envio WhatsApp (aqui você integraria com WhatsApp Business API)
        const whatsappResult = await enviarWhatsApp(cliente.whatsapp, mensagem)

        // Registrar tentativa na base de dados
        const { error: insertError } = await supabaseClient
          .from('mensagens_cobranca')
          .insert({
            user_id: cliente.user_id,
            cliente_id: cliente.id,
            tipo_mensagem: tipoMensagem,
            template_usado: template.nome,
            mensagem_enviada: mensagem,
            status_entrega: whatsappResult.success ? 'enviado' : 'erro',
            whatsapp_message_id: whatsappResult.messageId || null,
            erro_detalhes: whatsappResult.error || null
          })

        if (insertError) {
          console.error(`❌ Erro ao registrar mensagem para ${cliente.nome}:`, insertError)
        }

        processResults.push({
          cliente: cliente.nome,
          tipo: tipoMensagem,
          success: whatsappResult.success,
          error: whatsappResult.error
        })

        console.log(`✅ Processado ${cliente.nome} - Sucesso: ${whatsappResult.success}`)

        // Rate limit: aguardar 2 segundos entre mensagens
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        console.error(`❌ Erro ao processar cliente ${cliente.nome}:`, error)
        processResults.push({
          cliente: cliente.nome,
          success: false,
          error: error.message
        })
      }
    }

    console.log('🎯 Processo de cobrança concluído')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Processo de cobrança executado com sucesso',
        processed: processResults.length,
        results: processResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Função para simular envio WhatsApp
async function enviarWhatsApp(numeroWhatsApp: string, mensagem: string) {
  try {
    // Aqui você integraria com WhatsApp Business API
    // Por enquanto, vamos simular o envio
    console.log(`📱 Enviando para ${numeroWhatsApp}: ${mensagem.substring(0, 30)}...`)
    
    // Simular sucesso/falha aleatório para demonstração
    const success = Math.random() > 0.1 // 90% de sucesso
    
    if (success) {
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        error: null
      }
    } else {
      return {
        success: false,
        messageId: null,
        error: 'Número WhatsApp inválido ou indisponível'
      }
    }
  } catch (error) {
    return {
      success: false,
      messageId: null,
      error: error.message
    }
  }
}
