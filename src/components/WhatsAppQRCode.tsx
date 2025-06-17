
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { 
  QrCode, 
  Smartphone, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  X,
  Clock,
  Scan,
  Server,
  Code
} from 'lucide-react';

const WhatsAppQRCode = () => {
  const connectionHook = useWhatsAppConnection();
  const { 
    connection, 
    connect, 
    disconnect, 
    retry, 
    generateNewQR,
    isLoading 
  } = connectionHook;

  const getStatusInfo = () => {
    switch (connection.status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          text: 'Conectado',
          variant: 'default' as const,
          description: `Conectado: ${connection.phoneNumber}`
        };
      case 'connecting':
        return {
          icon: Clock,
          color: 'text-blue-600',
          text: 'Aguardando Conexão',
          variant: 'secondary' as const,
          description: 'Tentando conectar com servidor WhatsApp'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          text: 'Erro na Conexão',
          variant: 'destructive' as const,
          description: connection.lastError || 'Erro desconhecido'
        };
      default:
        return {
          icon: Smartphone,
          color: 'text-gray-600',
          text: 'Desconectado',
          variant: 'outline' as const,
          description: 'Clique em "Conectar WhatsApp" para iniciar'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="w-full max-w-lg mx-auto bg-white shadow-lg">
      <CardHeader className="text-center bg-white">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Smartphone className="w-6 h-6 text-green-600" />
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
        {/* Aguardando Conexão */}
        {connection.status === 'connecting' && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Testando conexão com WhatsApp Cloud API...</p>
            <p className="text-sm text-gray-500">Verificando credenciais e conectividade</p>
          </div>
        )}

        {/* Connected Status */}
        {connection.isConnected && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">WhatsApp Cloud API Conectado!</span>
            </div>
            <div className="space-y-1 text-sm text-green-700">
              <p><strong>Número:</strong> {connection.phoneNumber}</p>
              <p><strong>Phone Number ID:</strong> {connection.phoneNumberId}</p>
              {connection.lastSeen && (
                <p><strong>Última verificação:</strong> {new Date(connection.lastSeen).toLocaleString('pt-BR')}</p>
              )}
              <p className="text-xs text-green-600 mt-2 bg-white p-2 rounded border border-green-200">
                ✓ API ativa - pronto para envio de mensagens
              </p>
            </div>
          </div>
        )}

        {/* Error Status */}
        {connection.status === 'error' && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Erro na Conexão</span>
            </div>
            {connection.lastError && (
              <p className="text-sm text-red-600 mb-2 bg-white p-2 rounded border border-red-200">{connection.lastError}</p>
            )}
            {connection.retryCount > 0 && (
              <p className="text-xs text-red-600">
                Tentativas realizadas: {connection.retryCount}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {connection.status === 'disconnected' && (
            <Button 
              onClick={connect} 
              disabled={isLoading}
              className="flex items-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Server className="w-5 h-5" />
              {isLoading ? 'Conectando...' : 'Testar Conexão API'}
            </Button>
          )}

          {connection.status === 'connecting' && (
            <div className="flex gap-2">
              <Button 
                onClick={retry} 
                variant="outline"
                className="flex items-center gap-2 flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
              <Button 
                onClick={disconnect} 
                variant="outline"
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          )}

          {connection.isConnected && (
            <Button 
              onClick={disconnect} 
              variant="outline"
              className="flex items-center gap-2 w-full border-red-300 text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
              Desconectar API
            </Button>
          )}

          {connection.status === 'error' && (
            <div className="flex gap-2">
              <Button 
                onClick={retry} 
                variant="outline"
                className="flex items-center gap-2 flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
              <Button 
                onClick={disconnect} 
                variant="outline"
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Resetar
              </Button>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Server className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">WhatsApp Cloud API:</p>
              <p>Esta implementação usa a API oficial do WhatsApp Business para envio de mensagens. Configure suas credenciais na aba "Configuração".</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppQRCode;
