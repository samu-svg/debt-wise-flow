
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

export interface NotifyDevedorData {
  phone: string
  name: string
  flow: string
  customFields: Record<string, any>
}

export interface NotifyDevedorResponse {
  success: boolean
  message: string
  data?: any
}

export const useNotifyDevedor = () => {
  const [isLoading, setIsLoading] = useState(false)

  const notifyDevedor = async (data: NotifyDevedorData): Promise<NotifyDevedorResponse | null> => {
    setIsLoading(true)

    try {
      // URL da Edge Function do Supabase
      const response = await fetch('/api/notify-devedor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar notificação')
      }

      toast({
        title: "Sucesso!",
        description: "Notificação enviada para o devedor",
      })

      return result
    } catch (error) {
      console.error('Erro ao notificar devedor:', error)
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar notificação",
        variant: "destructive",
      })

      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    notifyDevedor,
    isLoading
  }
}
