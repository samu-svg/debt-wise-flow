
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { toast } from '@/hooks/use-toast';
import { Settings, Clock, RefreshCw, Save, Zap, Timer, MessageSquare } from 'lucide-react';
import { WhatsAppConfig as ConfigType } from '@/types/whatsapp';

const WhatsAppConfig = () => {
  const { config, updateConfig } = useWhatsAppCloudAPI();
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
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header Card */}
      <Card className="border-l-4 border-l-green-500 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl text-gray-900">
            <div className="p-2 bg-green-100 rounded-lg">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            Configurações do WhatsApp
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Configure o comportamento da conexão e mensagens automáticas
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configurações de Reconexão */}
      <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            Reconexão Automática
          </CardTitle>
          <CardDescription>
            Configure como o sistema se comporta em caso de perda de conexão
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Switch Principal */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <Label htmlFor="autoReconnect" className="text-sm font-semibold text-gray-900">
                  Reconexão Automática
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Reconectar automaticamente se a conexão cair
                </p>
              </div>
            </div>
            <Switch
              id="autoReconnect"
              checked={formData.autoReconnect || false}
              onCheckedChange={(checked) => handleChange('autoReconnect', checked)}
            />
          </div>

          {/* Grid de Configurações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="retryInterval" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Timer className="w-4 h-4 text-orange-500" />
                Intervalo entre Tentativas
              </Label>
              <Input
                id="retryInterval"
                type="number"
                value={formData.retryInterval || 15000}
                onChange={(e) => handleChange('retryInterval', parseInt(e.target.value))}
                min="5000"
                max="300000"
                step="1000"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 bg-orange-50 p-2 rounded border border-orange-200">
                💡 Tempo em milissegundos (5s - 5min)
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="maxRetries" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <RefreshCw className="w-4 h-4 text-red-500" />
                Máximo de Tentativas
              </Label>
              <Input
                id="maxRetries"
                type="number"
                value={formData.maxRetries || 20}
                onChange={(e) => handleChange('maxRetries', parseInt(e.target.value))}
                min="1"
                max="50"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 bg-red-50 p-2 rounded border border-red-200">
                🔄 Tentativas antes de parar
              </p>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="messageDelay" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                Delay entre Mensagens
              </Label>
              <Input
                id="messageDelay"
                type="number"
                value={formData.messageDelay || 2000}
                onChange={(e) => handleChange('messageDelay', parseInt(e.target.value))}
                min="500"
                max="10000"
                step="100"
                className="font-mono max-w-md"
              />
              <p className="text-xs text-gray-500 bg-purple-50 p-2 rounded border border-purple-200">
                ⏱️ Tempo de espera entre envio de mensagens (ms)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horário Comercial */}
      <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            Horário Comercial
          </CardTitle>
          <CardDescription>
            Defina quando as mensagens podem ser enviadas automaticamente
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Switch do Horário Comercial */}
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <Label htmlFor="businessHoursEnabled" className="text-sm font-semibold text-gray-900">
                  Respeitar Horário Comercial
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Enviar mensagens apenas no horário configurado
                </p>
              </div>
            </div>
            <Switch
              id="businessHoursEnabled"
              checked={formData.businessHours?.enabled || false}
              onCheckedChange={(checked) => handleBusinessHoursChange('enabled', checked)}
            />
          </div>

          {/* Configuração de Horários */}
          {formData.businessHours?.enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 p-4 bg-white border border-amber-200 rounded-xl">
              <div className="space-y-3">
                <Label htmlFor="businessStart" className="text-sm font-medium text-gray-700">
                  🌅 Horário de Início
                </Label>
                <Input
                  id="businessStart"
                  type="time"
                  value={formData.businessHours?.start || '09:00'}
                  onChange={(e) => handleBusinessHoursChange('start', e.target.value)}
                  className="font-mono text-lg"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="businessEnd" className="text-sm font-medium text-gray-700">
                  🌇 Horário de Fim
                </Label>
                <Input
                  id="businessEnd"
                  type="time"
                  value={formData.businessHours?.end || '18:00'}
                  onChange={(e) => handleBusinessHoursChange('end', e.target.value)}
                  className="font-mono text-lg"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="text-sm text-gray-600">
              {hasChanges ? (
                <span className="text-orange-600 font-medium">⚠️ Alterações não salvas</span>
              ) : (
                <span className="text-green-600 font-medium">✅ Configurações em sincronia</span>
              )}
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges}
                className="flex items-center gap-2 flex-1 sm:flex-none"
              >
                <RefreshCw className="w-4 h-4" />
                Cancelar
              </Button>
              
              <Button 
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center gap-2 flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo das Configurações Ativas */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gray-800">📋 Configurações Ativas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="text-gray-600">Reconexão:</span>
              <p className="font-semibold text-gray-900">
                {config.autoReconnect ? '✅ Ativada' : '❌ Desativada'}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="text-gray-600">Intervalo:</span>
              <p className="font-semibold text-gray-900">{(config.retryInterval || 15000) / 1000}s</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="text-gray-600">Max Tentativas:</span>
              <p className="font-semibold text-gray-900">{config.maxRetries || 20}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="text-gray-600">Delay Mensagens:</span>
              <p className="font-semibold text-gray-900">{config.messageDelay || 2000}ms</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="text-gray-600">Horário Comercial:</span>
              <p className="font-semibold text-gray-900">
                {config.businessHours?.enabled ? '✅ Ativo' : '❌ Inativo'}
              </p>
            </div>
            {config.businessHours?.enabled && (
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="text-gray-600">Horário:</span>
                <p className="font-semibold text-gray-900">
                  {config.businessHours?.start || '09:00'} - {config.businessHours?.end || '18:00'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppConfig;
