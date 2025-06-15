
import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { toast } from '@/hooks/use-toast';
import { 
  Settings, 
  Key, 
  Phone, 
  Building2, 
  TestTube,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  Cloud,
  ExternalLink,
  Shield,
  Zap,
  Lock,
  Webhook
} from 'lucide-react';

const WhatsAppOverview = memo(() => {
  const { 
    config, 
    connection, 
    updateConfig, 
    testConnection, 
    validateConfiguration, 
    isLoading, 
    isConfigDirty 
  } = useWhatsAppCloudAPI();
  
  const [formData, setFormData] = useState({
    accessToken: config.accessToken || '',
    phoneNumberId: config.phoneNumberId || '',
    businessAccountId: config.businessAccountId || '',
    webhookToken: config.webhookToken || 'whatsapp_webhook_token'
  });

  // Sincronizar formData com config quando config mudar
  useEffect(() => {
    setFormData({
      accessToken: config.accessToken || '',
      phoneNumberId: config.phoneNumberId || '',
      businessAccountId: config.businessAccountId || '',
      webhookToken: config.webhookToken || 'whatsapp_webhook_token'
    });
  }, [config]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    updateConfig({ [field]: value });
  };

  const handleValidate = async () => {
    updateConfig(formData);
    const isValid = await validateConfiguration();
    if (isValid) {
      toast({
        title: "Configuração válida!",
        description: "Todas as credenciais foram validadas com sucesso",
      });
    } else {
      toast({
        title: "Configuração inválida",
        description: "Verifique suas credenciais e tente novamente",
        variant: "destructive"
      });
    }
  };

  const handleTest = async () => {
    updateConfig(formData);
    const success = await testConnection();
    if (success) {
      toast({
        title: "Conexão estabelecida!",
        description: "WhatsApp Cloud API conectado com sucesso",
      });
    } else {
      toast({
        title: "Erro na conexão",
        description: "Verifique suas configurações e tente novamente",
        variant: "destructive"
      });
    }
  };

  const getStatusInfo = () => {
    switch (connection.status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'Conectado',
          variant: 'default' as const,
          description: `API ativa - ID: ${connection.phoneNumberId}`
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Erro na API',
          variant: 'destructive' as const,
          description: connection.lastError || 'Erro desconhecido'
        };
      default:
        return {
          icon: Settings,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: 'Não Configurado',
          variant: 'outline' as const,
          description: 'Configure suas credenciais da WhatsApp Cloud API'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const hasConfig = config.accessToken && config.phoneNumberId && config.businessAccountId;
  const hasBasicConfig = config.accessToken && config.phoneNumberId;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Status Header */}
      <Card className={`${statusInfo.borderColor} border-l-4 shadow-sm hover:shadow-md transition-shadow`}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
                <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
                    {statusInfo.text}
                  </Badge>
                  {isConfigDirty && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300 px-2 py-1">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Salvando...
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 text-sm max-w-md">{statusInfo.description}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 w-full lg:w-auto">
              {hasConfig && (
                <Button 
                  onClick={handleValidate}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2 flex-1 lg:flex-none border-green-300 text-green-700 hover:bg-green-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  Validar
                </Button>
              )}
              
              {hasBasicConfig && (
                <Button 
                  onClick={handleTest}
                  disabled={isLoading}
                  size="sm"
                  className={`flex items-center gap-2 flex-1 lg:flex-none ${
                    connection.isConnected 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  {isLoading ? 'Testando...' : 'Testar Conexão'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            Credenciais da API
          </CardTitle>
          <CardDescription className="text-base">
            Configure suas credenciais da Meta Business para usar a WhatsApp Cloud API
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Access Token */}
          <div className="space-y-3">
            <Label htmlFor="accessToken" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="p-1 bg-red-100 rounded">
                <Lock className="w-3 h-3 text-red-600" />
              </div>
              Access Token
            </Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="EAAxxxxxxxxxx..."
              value={formData.accessToken}
              onChange={(e) => handleChange('accessToken', e.target.value)}
              className="font-mono text-sm bg-gray-50 border-gray-300 focus:bg-white transition-colors"
            />
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                🔑 Token de acesso permanente da sua aplicação Meta Business
              </p>
            </div>
          </div>

          {/* Phone Number ID */}
          <div className="space-y-3">
            <Label htmlFor="phoneNumberId" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="p-1 bg-green-100 rounded">
                <Phone className="w-3 h-3 text-green-600" />
              </div>
              Phone Number ID
            </Label>
            <Input
              id="phoneNumberId"
              placeholder="123456789012345"
              value={formData.phoneNumberId}
              onChange={(e) => handleChange('phoneNumberId', e.target.value)}
              className="font-mono text-sm bg-gray-50 border-gray-300 focus:bg-white transition-colors"
            />
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-xs text-green-700">
                📱 ID do número de telefone configurado no WhatsApp Business
              </p>
            </div>
          </div>

          {/* Business Account ID */}
          <div className="space-y-3">
            <Label htmlFor="businessAccountId" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="p-1 bg-purple-100 rounded">
                <Building2 className="w-3 h-3 text-purple-600" />
              </div>
              Business Account ID
            </Label>
            <Input
              id="businessAccountId"
              placeholder="123456789012345"
              value={formData.businessAccountId}
              onChange={(e) => handleChange('businessAccountId', e.target.value)}
              className="font-mono text-sm bg-gray-50 border-gray-300 focus:bg-white transition-colors"
            />
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-700">
                🏢 ID da conta comercial do WhatsApp Business
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Connected Status Details */}
          {connection.isConnected && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <div className="flex items-center gap-3 text-green-800 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-semibold text-lg">WhatsApp Cloud API Ativa!</span>
              </div>
              <div className="space-y-3 text-sm text-green-700">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="font-semibold mb-2">Phone ID:</p>
                  <p className="text-xs font-mono bg-green-50 p-3 rounded border border-green-300 break-all">
                    {connection.phoneNumberId}
                  </p>
                </div>
                {connection.lastSeen && (
                  <p className="bg-white p-3 rounded-lg border border-green-200">
                    <strong>Última atividade:</strong> {new Date(connection.lastSeen).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Details */}
          {connection.status === 'error' && connection.lastError && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-xl border border-red-200">
              <div className="flex items-center gap-3 text-red-800 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <span className="font-semibold text-lg">Erro na API</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 break-words leading-relaxed">
                  {connection.lastError}
                </p>
              </div>
            </div>
          )}

          {/* Webhook Configuration */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Webhook className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-blue-700 w-full">
                <p className="font-semibold mb-3 text-base">Configuração do Webhook</p>
                <div className="bg-white p-4 rounded-lg border border-blue-200 space-y-2">
                  <div>
                    <p className="font-semibold text-blue-800">URL:</p>
                    <p className="font-mono text-xs bg-blue-50 p-2 rounded border border-blue-300 break-all">
                      https://errzltarqbkkcldzivud.supabase.co/functions/v1/whatsapp-cloud-api/webhook
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">Token:</p>
                    <p className="font-mono text-xs bg-blue-50 p-2 rounded border border-blue-300">
                      whatsapp_webhook_token
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm">
                  💡 Configure esta URL no seu app Meta Business para receber webhooks.
                </p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                <Cloud className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-2 text-base text-gray-900">WhatsApp Cloud API</p>
                <p className="mb-3 leading-relaxed">
                  API oficial da Meta para integração com WhatsApp Business. Oferece recursos avançados 
                  para envio de mensagens, templates e automação comercial.
                </p>
                <a 
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  📚 Documentação Oficial <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

WhatsAppOverview.displayName = 'WhatsAppOverview';

export default WhatsAppOverview;
