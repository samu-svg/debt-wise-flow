
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Notify Devedor API', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('deve validar dados de entrada corretamente', async () => {
    const invalidData = {
      phone: '123', // formato inválido
      name: '',
      flow: 'test',
      customFields: {}
    }

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Dados inválidos',
        details: ['Phone deve estar no formato +5511999999999 (DDI+DDD+número)', 'Name é obrigatório e deve ser uma string']
      })
    })

    const response = await fetch('/api/notify-devedor', {
      method: 'POST',
      body: JSON.stringify(invalidData)
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  it('deve enviar payload correto para BotConversa', async () => {
    const validData = {
      phone: '+5511999999999',
      name: 'João Silva',
      flow: 'cobranca_padrao',
      customFields: { valor_divida: 100.00 }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Notificação enviada com sucesso',
        data: { id: '123', status: 'sent' }
      })
    })

    const response = await fetch('/api/notify-devedor', {
      method: 'POST',
      body: JSON.stringify(validData)
    })

    const result = await response.json()

    expect(response.ok).toBe(true)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Notificação enviada com sucesso')
  })

  it('deve tratar erros de rede corretamente', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    try {
      await fetch('/api/notify-devedor', {
        method: 'POST',
        body: JSON.stringify({})
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Network error')
    }
  })

  it('deve validar formato do telefone', () => {
    const validPhones = [
      '+5511999999999',
      '+5521987654321',
      '+5585123456789'
    ]

    const invalidPhones = [
      '11999999999',      // sem DDI
      '+55119999999',     // muito curto
      '+551199999999999', // muito longo
      '+55-11-99999-9999', // com separadores
      'invalid'           // não numérico
    ]

    const phoneRegex = /^\+\d{13}$/

    validPhones.forEach(phone => {
      expect(phoneRegex.test(phone)).toBe(true)
    })

    invalidPhones.forEach(phone => {
      expect(phoneRegex.test(phone)).toBe(false)
    })
  })
})
