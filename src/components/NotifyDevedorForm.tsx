
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useNotifyDevedor, NotifyDevedorData } from '@/hooks/useNotifyDevedor'

export const NotifyDevedorForm = () => {
  const { notifyDevedor, isLoading } = useNotifyDevedor()
  const [formData, setFormData] = useState<NotifyDevedorData>({
    phone: '+5511999999999',
    name: '',
    flow: 'cobranca_padrao',
    customFields: {}
  })
  const [customFieldsJson, setCustomFieldsJson] = useState('{"valor_divida": 100.00, "dias_atraso": 5}')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const customFields = JSON.parse(customFieldsJson)
      const data = {
        ...formData,
        customFields
      }
      
      await notifyDevedor(data)
    } catch (error) {
      console.error('Erro ao parsear customFields:', error)
    }
  }

  const handleInputChange = (field: keyof NotifyDevedorData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Notificar Devedor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">Telefone (DDI+DDD+número)</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+5511999999999"
              required
            />
          </div>

          <div>
            <Label htmlFor="name">Nome do Devedor</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="João Silva"
              required
            />
          </div>

          <div>
            <Label htmlFor="flow">Fluxo BotConversa</Label>
            <Input
              id="flow"
              value={formData.flow}
              onChange={(e) => handleInputChange('flow', e.target.value)}
              placeholder="cobranca_padrao"
              required
            />
          </div>

          <div>
            <Label htmlFor="customFields">Custom Fields (JSON)</Label>
            <Textarea
              id="customFields"
              value={customFieldsJson}
              onChange={(e) => setCustomFieldsJson(e.target.value)}
              placeholder='{"valor_divida": 100.00}'
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Enviando...' : 'Enviar Notificação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
