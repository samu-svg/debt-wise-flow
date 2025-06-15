
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
  Shield
} from 'lucide-react';

const WhatsAppOverview = memo(() => {
  const { config, connection, updateConfig, testConnection, isLoading, isConfigDirty } = useWhatsAppCloudAPI();
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
  const hasConfig = config.accessToken && config.phoneNumberId;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Header - Mobile Optimized */}
      <Card className={`${statusInfo.borderColor} border-l-4`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
                <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={statusInfo.variant} className="text-xs">
                    {statusInfo.text}
                  </Badge>
                  {isConfigDirty && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Salvando...
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{statusInfo.description}</p>
              </div>
            </div>
            
            {/* Test Connection Button - Mobile Responsive */}
            {hasConfig && (
              <Button 
                onClick={handleTest}
                disabled={isLoading}
                size="sm"
                className="flex items-center gap-2 w-full sm:w-auto"
                variant={connection.isConnected ? "outline" : "default"}
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
        </CardContent>
      </Card>

      {/* Configuration Form - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="w-5 h-5" />
            Credenciais da API
          </CardTitle>
          <CardDescription>
            Configure suas credenciais da Meta Business para usar a WhatsApp Cloud API
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="accessToken" className="flex items-center gap-2 text-sm font-medium">
              <Key className="w-4 h-4" />
              Access Token
            </Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="EAAxxxxxxxxxx..."
              value={formData.accessToken}
              onChange={(e) => handleChange('accessToken', e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* Phone Number ID */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumberId" className="flex items-center gap-2 text-sm font-medium">
              <Phone className="w-4 h-4" />
              Phone Number ID
            </Label>
            <Input
              id="phoneNumberId"
              placeholder="123456789012345"
              value={formData.phoneNumberId}
              onChange={(e) => handleChange('phoneNumberId', e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* Business Account ID */}
          <div className="space-y-2">
            <Label htmlFor="businessAccountId" className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="w-4 h-4" />
              Business Account ID
            </Label>
            <Input
              id="businessAccountId"
              placeholder="123456789012345"
              value={formData.businessAccountId}
              onChange={(e) => handleChange('businessAccountId', e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <Separator />

          {/* Connected Status Details */}
          {connection.isConnected && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800 mb-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">WhatsApp Cloud API Ativa!</span>
              </div>
              <div className="space-y-2 text-sm text-green-700">
                <div>
                  <p className="font-medium">Phone ID:</p>
                  <p className="text-xs font-mono bg-white p-2 rounded border border-green-300 break-all">
                    {connection.phoneNumberId}
                  </p>
                </div>
                {connection.lastSeen && (
                  <p><strong>Última atividade:</strong> {new Date(connection.lastSeen).toLocaleString('pt-BR')}</p>
                )}
              </div>
            </div>
          )}

          {/* Error Details */}
          {connection.status === 'error' && connection.lastError && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Erro na API</span>
              </div>
              <p className="text-sm text-red-600 bg-white p-3 rounded border border-red-200 break-words">
                {connection.lastError}
              </p>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Cloud className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">WhatsApp Cloud API</p>
                <p className="mb-2">API oficial da Meta para integração com WhatsApp Business.</p>
                <a 
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                >
                  Documentação <ExternalLink className="w-3 h-3" />
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
