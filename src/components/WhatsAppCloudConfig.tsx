
import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Loader2
} from 'lucide-react';

const WhatsAppCloudConfig = memo(() => {
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
    // Auto-save com debounce através do hook
    updateConfig({ [field]: value });
  };

  const handleSave = () => {
    updateConfig(formData);
    toast({
      title: "Configurações salvas!",
      description: "As configurações da WhatsApp Cloud API foram atualizadas",
    });
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

  return (
    <div className="space-y-6">
      {/* Status Card Otimizado */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Status da Conexão
            {isConfigDirty && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Salvando...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {connection.isConnected ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                <span className="text-sm text-gray-600">
                  ID: {connection.phoneNumberId}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                <Badge variant="secondary">Desconectado</Badge>
                {connection.lastError && (
                  <span className="text-sm text-red-600 truncate max-w-xs">
                    {connection.lastError}
                  </span>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card Otimizado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Credenciais da API
          </CardTitle>
          <CardDescription>
            Configure suas credenciais da Meta Business para usar a WhatsApp Cloud API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessToken" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Access Token
            </Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="EAAxxxxxxxxxx..."
              value={formData.accessToken}
              onChange={(e) => handleChange('accessToken', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumberId" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number ID
            </Label>
            <Input
              id="phoneNumberId"
              placeholder="123456789012345"
              value={formData.phoneNumberId}
              onChange={(e) => handleChange('phoneNumberId', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAccountId" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Business Account ID
            </Label>
            <Input
              id="businessAccountId"
              placeholder="123456789012345"
              value={formData.businessAccountId}
              onChange={(e) => handleChange('businessAccountId', e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={handleSave}
              className="flex items-center gap-2"
              disabled={isConfigDirty}
            >
              {isConfigDirty ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isConfigDirty ? 'Salvando...' : 'Salvar'}
            </Button>
            
            <Button 
              onClick={handleTest}
              disabled={!formData.accessToken || !formData.phoneNumberId || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              {isLoading ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

WhatsAppCloudConfig.displayName = 'WhatsAppCloudConfig';

export default WhatsAppCloudConfig;
