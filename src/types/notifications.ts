
export interface NotifyDevedorRequest {
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

export interface NotifyDevedorError {
  error: string
  details?: string[]
}

export interface BotConversaConfig {
  webhookUrl: string
  timeout?: number
  retries?: number
}
