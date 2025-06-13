
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
  Scan
} from 'lucide-react';

const WhatsAppQRCode = () => {
  const { 
    connection, 
    connect, 
    disconnect, 
    retry, 
    generateNewQR, 
    simulateManualConnection, 
    isLoading 
  } = useWhatsAppConnection();

  const getStatusInfo = () => {
    switch (connection.status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          text: 'Conectado',
          variant: 'default' as const,
          description: `Conectado: ${connection.phoneNumber}`
        };
      case 'connecting':
        return {
          icon: Clock,
          color: 'text-blue-500',
          text: 'Aguardando Escaneamento',
          variant: 'secondary' as const,
          description: 'Escaneie o QR Code com seu WhatsApp'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          text: 'Erro na Conexão',
          variant: 'destructive' as const,
          description: connection.lastError || 'Erro desconhecido'
        };
      default:
        return {
          icon: Smartphone,
          color: 'text-gray-500',
          text: 'Desconectado',
          variant: 'outline' as const,
          description: 'Clique em "Conectar WhatsApp" para iniciar'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Smartphone className="w-6 h-6 text-green-600" />
          <CardTitle>WhatsApp Web Connection</CardTitle>
        </div>
        <div className="flex items-center justify-center gap-2">
          <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
          <Badge variant={statusInfo.variant}>
            {statusInfo.text}
          </Badge>
        </div>
        <CardDescription className="mt-2">
          {statusInfo.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        {connection.status === 'connecting' && connection.qrCode && (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-6 bg-white rounded-xl shadow-inner border-2 border-gray-100">
              <img 
                src={connection.qrCode} 
                alt="QR Code WhatsApp" 
                className="w-64 h-64 block"
              />
            </div>
            
            <div className="text-center space-y-3">
              <div className="flex items-center gap-2 justify-center text-blue-600">
                <Scan className="w-5 h-5" />
                <span className="font-medium">Escaneie com seu WhatsApp</span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Vá em Menu → Aparelhos conectados</p>
                <p>3. Toque em "Conectar um aparelho"</p>
                <p>4. Escaneie este QR Code</p>
              </div>
              
              <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>QR Code válido por 5 minutos</span>
              </div>
            </div>
          </div>
        )}

        {/* Connected Status */}
        {connection.isConnected && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">WhatsApp Conectado com Sucesso!</span>
            </div>
            <div className="space-y-1 text-sm text-green-700">
              <p><strong>Número:</strong> {connection.phoneNumber}</p>
              {connection.lastSeen && (
                <p><strong>Última atividade:</strong> {new Date(connection.lastSeen).toLocaleString('pt-BR')}</p>
              )}
              <p className="text-xs text-green-600 mt-2">
                ✓ Conexão ativa e pronta para envio de mensagens
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
              <p className="text-sm text-red-600 mb-2">{connection.lastError}</p>
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
              className="flex items-center gap-2 w-full"
              size="lg"
            >
              <QrCode className="w-5 h-5" />
              Conectar WhatsApp
            </Button>
          )}

          {connection.status === 'connecting' && (
            <div className="flex gap-2">
              <Button 
                onClick={generateNewQR} 
                variant="outline"
                className="flex items-center gap-2 flex-1"
              >
                <RefreshCw className="w-4 h-4" />
                Gerar Novo QR
              </Button>
              <Button 
                onClick={disconnect} 
                variant="outline"
                className="flex items-center gap-2"
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
              className="flex items-center gap-2 w-full"
            >
              <X className="w-4 h-4" />
              Desconectar WhatsApp
            </Button>
          )}

          {connection.status === 'error' && (
            <div className="flex gap-2">
              <Button 
                onClick={retry} 
                variant="outline"
                className="flex items-center gap-2 flex-1"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
              <Button 
                onClick={disconnect} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          )}

          {/* Botão de teste para simular conexão - REMOVER EM PRODUÇÃO */}
          {connection.status === 'connecting' && process.env.NODE_ENV === 'development' && (
            <Button 
              onClick={simulateManualConnection}
              variant="secondary"
              className="flex items-center gap-2 w-full text-xs"
              size="sm"
            >
              🧪 Simular Conexão Manual (Teste)
            </Button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <QrCode className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Dica:</p>
              <p>Mantenha esta aba aberta durante o escaneamento. O QR Code é renovado automaticamente a cada 5 minutos por segurança.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppQRCode;
