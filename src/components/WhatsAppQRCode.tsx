
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
  X
} from 'lucide-react';

const WhatsAppQRCode = () => {
  const { connection, connect, disconnect, retry, isLoading } = useWhatsAppConnection();

  const getStatusInfo = () => {
    switch (connection.status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'bg-green-500',
          text: 'Conectado',
          variant: 'default' as const
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          color: 'bg-yellow-500',
          text: 'Conectando',
          variant: 'secondary' as const
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'bg-red-500',
          text: 'Erro',
          variant: 'destructive' as const
        };
      default:
        return {
          icon: X,
          color: 'bg-gray-500',
          text: 'Desconectado',
          variant: 'outline' as const
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Smartphone className="w-6 h-6 text-green-600" />
          <CardTitle>WhatsApp Web</CardTitle>
        </div>
        <div className="flex items-center justify-center gap-2">
          <StatusIcon className={`w-4 h-4 ${
            connection.status === 'connected' ? 'text-green-500' :
            connection.status === 'connecting' ? 'text-yellow-500 animate-spin' :
            connection.status === 'error' ? 'text-red-500' :
            'text-gray-500'
          }`} />
          <Badge variant={statusInfo.variant}>
            {statusInfo.text}
          </Badge>
        </div>
        <CardDescription>
          {connection.isConnected 
            ? `Conectado: ${connection.phoneNumber}`
            : 'Escaneie o QR Code com seu WhatsApp'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {connection.status === 'connecting' && connection.qrCode && (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-inner">
              <img 
                src={connection.qrCode} 
                alt="QR Code WhatsApp" 
                className="w-48 h-48"
              />
            </div>
            <div className="text-center text-sm text-gray-600">
              <p className="flex items-center gap-2 justify-center">
                <QrCode className="w-4 h-4" />
                Abra o WhatsApp no seu celular
              </p>
              <p>Vá em Configurações → Aparelhos conectados</p>
              <p>Toque em "Conectar um aparelho" e escaneie</p>
            </div>
          </div>
        )}

        {connection.isConnected && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">WhatsApp Conectado!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Número: {connection.phoneNumber}
            </p>
            {connection.lastSeen && (
              <p className="text-xs text-green-600">
                Última atividade: {new Date(connection.lastSeen).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        )}

        {connection.status === 'error' && (
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Erro na Conexão</span>
            </div>
            {connection.lastError && (
              <p className="text-sm text-red-600 mt-1">{connection.lastError}</p>
            )}
            {connection.retryCount > 0 && (
              <p className="text-xs text-red-600">
                Tentativas: {connection.retryCount}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-center">
          {!connection.isConnected ? (
            <Button 
              onClick={connect} 
              disabled={isLoading || connection.status === 'connecting'}
              className="flex items-center gap-2"
            >
              {connection.status === 'connecting' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4" />
              )}
              {connection.status === 'connecting' ? 'Conectando...' : 'Conectar'}
            </Button>
          ) : (
            <Button 
              onClick={disconnect} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Desconectar
            </Button>
          )}

          {connection.status === 'error' && (
            <Button 
              onClick={retry} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppQRCode;
