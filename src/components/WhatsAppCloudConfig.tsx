
import { useState } from 'react';
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
  ExternalLink,
  Save
} from 'lucide-react';

const WhatsAppCloudConfig = () => {
  const { config, connection, updateConfig, testConnection, isLoading } = useWhatsAppCloudAPI();
  const [formData, setFormData] = useState({
    accessToken: config.accessToken || '',
    phoneNumberId: config.phoneNumberId || '',
    businessAccountId: config.businessAccountId || '',
    webhookToken: config.webhookToken || 'whatsapp_webhook_token'
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const webhookUrl = `https://errzltarqbkkcldzivud.supabase.co/functions/v1/whatsapp-cloud-api`;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Status da Conexão
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
                  <span className="text-sm text-red-600">{connection.lastError}</span>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configuração da WhatsApp Cloud API
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
            <p className="text-xs text-gray-600">
              Token de acesso permanente obtido no Meta Business Manager
            </p>
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
            <p className="text-xs text-gray-600">
              ID do número de telefone configurado no WhatsApp Business
            </p>
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
            <p className="text-xs text-gray-600">
              ID da conta comercial do WhatsApp Business
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookToken">Token de Verificação do Webhook</Label>
            <Input
              id="webhookToken"
              value={formData.webhookToken}
              onChange={(e) => handleChange('webhookToken', e.target.value)}
            />
            <p className="text-xs text-gray-600">
              Token usado para verificar webhooks (pode manter o padrão)
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Configurações
            </Button>
            
            <Button 
              onClick={handleTest}
              disabled={!formData.accessToken || !formData.phoneNumberId || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              {isLoading ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Webhook</CardTitle>
          <CardDescription>
            Configure este URL no seu Meta Business Manager para receber mensagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label>URL do Webhook:</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={webhookUrl} readOnly className="bg-gray-50" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                >
                  Copiar
                </Button>
              </div>
            </div>
            
            <div>
              <Label>Token de Verificação:</Label>
              <Input value={formData.webhookToken} readOnly className="bg-gray-50 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Como Configurar</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Acesse o <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">Meta Business Manager <ExternalLink className="w-3 h-3" /></a></li>
            <li>Crie um app e configure o WhatsApp Business API</li>
            <li>Obtenha o Access Token permanente</li>
            <li>Configure o número de telefone</li>
            <li>Configure o webhook com a URL fornecida acima</li>
            <li>Cole as credenciais nos campos acima e teste a conexão</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppCloudConfig;
