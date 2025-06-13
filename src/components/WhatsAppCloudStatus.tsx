
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { 
  Smartphone, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Cloud,
  MessageSquare,
  TestTube,
  ExternalLink
} from 'lucide-react';

const WhatsAppCloudStatus = () => {
  const { connection, config, testConnection, isLoading, templates } = useWhatsAppCloudAPI();

  const getStatusInfo = () => {
    switch (connection.status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          text: 'Conectado',
          variant: 'default' as const,
          description: `API ativa - ID: ${connection.phoneNumberId}`
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          text: 'Erro na API',
          variant: 'destructive' as const,
          description: connection.lastError || 'Erro desconhecido'
        };
      default:
        return {
          icon: Settings,
          color: 'text-gray-600',
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
    <Card className="w-full max-w-lg mx-auto bg-white shadow-lg">
      <CardHeader className="text-center bg-white">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Cloud className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-gray-900">WhatsApp Cloud API</CardTitle>
        </div>
        <div className="flex items-center justify-center gap-2">
          <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
          <Badge variant={statusInfo.variant}>
            {statusInfo.text}
          </Badge>
        </div>
        <CardDescription className="mt-2 text-gray-600">
          {statusInfo.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 bg-white">
        {/* API Status */}
        {connection.isConnected && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800 mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">WhatsApp Cloud API Ativa!</span>
            </div>
            <div className="space-y-2 text-sm text-green-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Phone ID:</strong></p>
                  <p className="text-xs font-mono bg-white p-1 rounded border border-green-300">
                    {connection.phoneNumberId}
                  </p>
                </div>
                <div>
                  <p><strong>Business ID:</strong></p>
                  <p className="text-xs font-mono bg-white p-1 rounded border border-green-300">
                    {connection.businessAccountId}
                  </p>
                </div>
              </div>
              {connection.lastSeen && (
                <p><strong>Última atividade:</strong> {new Date(connection.lastSeen).toLocaleString('pt-BR')}</p>
              )}
              <div className="flex items-center gap-2 mt-3 p-2 bg-white rounded border border-green-200">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">
                  {templates.length} templates disponíveis
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Status */}
        {connection.status === 'error' && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Erro na API</span>
            </div>
            {connection.lastError && (
              <p className="text-sm text-red-600 mb-3 bg-white p-2 rounded border border-red-200">
                {connection.lastError}
              </p>
            )}
            {connection.retryCount > 0 && (
              <p className="text-xs text-red-600">
                Tentativas realizadas: {connection.retryCount}
              </p>
            )}
          </div>
        )}

        {/* Configuration needed */}
        {!hasConfig && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
            <Settings className="w-12 h-12 mx-auto mb-3 text-blue-600" />
            <h3 className="font-medium text-blue-800 mb-2">Configuração Necessária</h3>
            <p className="text-sm text-blue-700 mb-4">
              Para usar a WhatsApp Cloud API, você precisa configurar suas credenciais da Meta Business.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-blue-600">Você precisará de:</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Access Token da Meta Business</li>
                <li>• Phone Number ID do WhatsApp Business</li>
                <li>• Business Account ID</li>
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {hasConfig && !connection.isConnected && (
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              className="flex items-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <TestTube className="w-5 h-5" />
              {isLoading ? 'Testando...' : 'Testar Conexão'}
            </Button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Cloud className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">WhatsApp Cloud API:</p>
              <p>API oficial da Meta para integração com WhatsApp Business. Permite envio de mensagens, templates aprovados e recebimento via webhooks.</p>
              <a 
                href="https://developers.facebook.com/docs/whatsapp/cloud-api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Documentação oficial <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppCloudStatus;
