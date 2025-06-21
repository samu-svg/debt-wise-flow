
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, AlertCircle } from 'lucide-react';

const WhatsAppConfig = () => {
  const [config, setConfig] = useState({
    phoneNumberId: '',
    accessToken: '',
    webhookToken: ''
  });
  const [isConnected, setIsConnected] = useState(false);

  const handleSave = () => {
    // Simulate saving configuration
    console.log('Saving WhatsApp configuration:', config);
    setIsConnected(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração do WhatsApp
        </CardTitle>
        <CardDescription>
          Configure as credenciais da API do WhatsApp Business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="phone-id">Phone Number ID</Label>
              <Input
                id="phone-id"
                value={config.phoneNumberId}
                onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                placeholder="Insira o Phone Number ID"
              />
            </div>

            <div>
              <Label htmlFor="access-token">Access Token</Label>
              <Input
                id="access-token"
                type="password"
                value={config.accessToken}
                onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                placeholder="Insira o Access Token"
              />
            </div>

            <div>
              <Label htmlFor="webhook-token">Webhook Token</Label>
              <Input
                id="webhook-token"
                value={config.webhookToken}
                onChange={(e) => setConfig({ ...config, webhookToken: e.target.value })}
                placeholder="Insira o Webhook Token"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                Certifique-se de que todas as configurações estão corretas antes de salvar.
              </p>
            </div>

            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configuração
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConfig;
