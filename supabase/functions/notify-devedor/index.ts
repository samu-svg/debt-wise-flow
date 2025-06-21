
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

// Schema de validação usando Zod nativo do Deno
interface NotifyDevedorRequest {
  phone: string
  name: string
  flow: string
  customFields: Record<string, any>
}

// Função para validar entrada
function validateRequest(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.phone || typeof data.phone !== 'string') {
    errors.push('Phone é obrigatório e deve ser uma string')
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name é obrigatório e deve ser uma string')
  }

  if (!data.flow || typeof data.flow !== 'string') {
    errors.push('Flow é obrigatório e deve ser uma string')
  }

  if (!data.customFields || typeof data.customFields !== 'object') {
    errors.push('CustomFields é obrigatório e deve ser um objeto')
  }

  // Validação do formato do telefone (DDI+DDD+número)
  if (data.phone && !/^\+\d{13}$/.test(data.phone)) {
    errors.push('Phone deve estar no formato +5511999999999 (DDI+DDD+número)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Função para fazer log das requisições
async function logRequest(type: 'success' | 'error', data: any, response?: any, error?: any) {
  const logData = {
    timestamp: new Date().toISOString(),
    type,
    request: data,
    response: response || null,
    error: error?.message || null
  }

  console.log(`[${type.toUpperCase()}] Notify Devedor:`, JSON.stringify(logData, null, 2))
}

// Função para enviar ao BotConversa
async function sendToBotConversa(payload: NotifyDevedorRequest) {
  const webhookUrl = Deno.env.get('BOTCONVERSA_WEBHOOK_URL')
  
  if (!webhookUrl) {
    throw new Error('BOTCONVERSA_WEBHOOK_URL não configurada')
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Sistema-Gestao-Devedores/1.0'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`BotConversa API retornou ${response.status}: ${response.statusText}`)
  }

  return await response.json()
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse do JSON
    const requestData = await req.json()
    
    // Validação dos dados
    const validation = validateRequest(requestData)
    if (!validation.isValid) {
      await logRequest('error', requestData, null, { message: validation.errors.join(', ') })
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos', 
          details: validation.errors 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Montar payload para BotConversa
    const payload: NotifyDevedorRequest = {
      phone: requestData.phone,
      name: requestData.name,
      flow: requestData.flow,
      customFields: requestData.customFields
    }

    // Enviar para BotConversa
    const botConversaResponse = await sendToBotConversa(payload)
    
    // Log de sucesso
    await logRequest('success', payload, botConversaResponse)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notificação enviada com sucesso',
        data: botConversaResponse
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro ao processar notificação:', error)
    
    // Log de erro
    await logRequest('error', null, null, error)

    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        message: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
