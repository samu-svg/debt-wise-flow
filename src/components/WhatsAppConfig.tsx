
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { toast } from '@/hooks/use-toast';
import { Settings, Clock, RefreshCw, Save } from 'lucide-react';
import { WhatsAppConfig as ConfigType } from '@/types/whatsapp';

const WhatsAppConfig = () => {
  const { config, updateConfig } = useWhatsAppConnection();
  const [formData, setFormData] = useState<Partial<ConfigType>>(config);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof ConfigType, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleBusinessHoursChange = (field: keyof ConfigType['businessHours'], value: any) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateConfig(formData);
    setHasChanges(false);
    toast({
      title: "Configurações salvas!",
      description: "As configurações do WhatsApp foram atualizadas",
    });
  };

  const handleReset = () => {
    setFormData(config);
    setHasChanges(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações do WhatsApp
        </CardTitle>
        <CardDescription>
          Configure o comportamento da conexão e mensagens automáticas
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configurações de Conexão */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reconexão Automática
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="autoReconnect" className="text-sm font-medium">
                  Reconexão Automática
                </Label>
                <p className="text-xs text-gray-600">
                  Reconectar automaticamente se a conexão cair
                </p>
              </div>
              <Switch
                id="autoReconnect"
                checked={formData.autoReconnect || false}
                onCheckedChange={(checked) => handleChange('autoReconnect', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retryInterval">Intervalo entre Tentativas (ms)</Label>
              <Input
                id="retryInterval"
                type="number"
                value={formData.retryInterval || 15000}
                onChange={(e) => handleChange('retryInterval', parseInt(e.target.value))}
                min="5000"
                max="300000"
                step="1000"
              />
              <p className="text-xs text-gray-600">
                Tempo entre tentativas de reconexão (5s - 5min)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRetries">Máximo de Tentativas</Label>
              <Input
                id="maxRetries"
                type="number"
                value={formData.maxRetries || 20}
                onChange={(e) => handleChange('maxRetries', parseInt(e.target.value))}
                min="1"
                max="50"
              />
              <p className="text-xs text-gray-600">
                Número máximo de tentativas antes de parar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageDelay">Delay entre Mensagens (ms)</Label>
              <Input
                id="messageDelay"
                type="number"
                value={formData.messageDelay || 2000}
                onChange={(e) => handleChange('messageDelay', parseInt(e.target.value))}
                min="500"
                max="10000"
                step="100"
              />
              <p className="text-xs text-gray-600">
                Tempo de espera entre envio de mensagens
              </p>
            </div>
          </div>
        </div>

        {/* Horário Comercial */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horário Comercial
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="businessHoursEnabled" className="text-sm font-medium">
                  Respeitar Horário Comercial
                </Label>
                <p className="text-xs text-gray-600">
                  Enviar mensagens apenas no horário configurado
                </p>
              </div>
              <Switch
                id="businessHoursEnabled"
                checked={formData.businessHours?.enabled || false}
                onCheckedChange={(checked) => handleBusinessHoursChange('enabled', checked)}
              />
            </div>

            {formData.businessHours?.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessStart">Horário de Início</Label>
                  <Input
                    id="businessStart"
                    type="time"
                    value={formData.businessHours?.start || '09:00'}
                    onChange={(e) => handleBusinessHoursChange('start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEnd">Horário de Fim</Label>
                  <Input
                    id="businessEnd"
                    type="time"
                    value={formData.businessHours?.end || '18:00'}
                    onChange={(e) => handleBusinessHoursChange('end', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            Cancelar
          </Button>
        </div>

        {/* Informações Atuais */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Configurações Ativas:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Reconexão: {config.autoReconnect ? 'Ativada' : 'Desativada'}</div>
            <div>Intervalo: {(config.retryInterval || 15000) / 1000}s</div>
            <div>Max Tentativas: {config.maxRetries || 20}</div>
            <div>Delay Mensagens: {config.messageDelay || 2000}ms</div>
            <div>Horário Comercial: {config.businessHours?.enabled ? 'Ativo' : 'Inativo'}</div>
            {config.businessHours?.enabled && (
              <div>Horário: {config.businessHours?.start || '09:00'} - {config.businessHours?.end || '18:00'}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConfig;
