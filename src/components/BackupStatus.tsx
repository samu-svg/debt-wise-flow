
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Settings,
  Folder,
  Lock
} from 'lucide-react';

const BackupStatus = () => {
  const { 
    isSupported, 
    isConfigured, 
    isConnected, 
    folderName,
    configureDirectory,
    isFirstAccess
  } = useFileSystemBackup();

  const getStatusInfo = () => {
    if (isFirstAccess || (!isConfigured && isSupported)) {
      return {
        icon: Lock,
        color: 'bg-red-500',
        text: 'Configuração Necessária',
        description: 'Configure pasta para armazenar dados'
      };
    }
    
    if (!isSupported) {
      return {
        icon: XCircle,
        color: 'bg-orange-500',
        text: 'Modo Download',
        description: 'Dados salvos via download'
      };
    }
    
    if (!isConfigured) {
      return {
        icon: AlertCircle,
        color: 'bg-orange-500',
        text: 'Não configurado',
        description: 'Configure pasta para dados'
      };
    }
    
    if (!isConnected) {
      return {
        icon: AlertCircle,
        color: 'bg-orange-500',
        text: 'Desconectado',
        description: 'Reconecte à pasta de dados'
      };
    }
    
    return {
      icon: CheckCircle,
      color: 'bg-green-500',
      text: 'Pasta Ativa ✅',
      description: `Dados em: ${folderName}`
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleReconnect = async () => {
    if (!isSupported) {
      return;
    }
    
    await configureDirectory();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 px-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
            <Database className="w-4 h-4" />
          </div>
          <Badge variant="outline" className="text-xs">
            {statusInfo.text}
          </Badge>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-5 h-5 ${
              statusInfo.color === 'bg-green-500' ? 'text-green-500' :
              statusInfo.color === 'bg-orange-500' ? 'text-orange-500' :
              statusInfo.color === 'bg-red-500' ? 'text-red-500' :
              'text-gray-500'
            }`} />
            <div>
              <p className="font-medium">{statusInfo.text}</p>
              <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
            </div>
          </div>

          {(isFirstAccess || (!isConfigured && isSupported)) && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>⚠️ Pasta Necessária</strong>
              </p>
              <p className="text-xs text-red-600 mt-1">
                Configure uma pasta local para armazenar os dados dos clientes e dívidas
              </p>
            </div>
          )}
          
          {isConnected && folderName && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Pasta Ativa:</strong> {folderName}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Dados salvos automaticamente na pasta local
              </p>
            </div>
          )}
          
          {!isSupported && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-600">
                Use Chrome ou Edge para armazenamento em pasta local
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            {(isFirstAccess || !isConfigured || !isConnected) && (
              <Button 
                onClick={handleReconnect} 
                size="sm"
                className="flex items-center gap-2"
                variant={isFirstAccess ? "default" : "outline"}
              >
                <Folder className="w-4 h-4" />
                {isFirstAccess ? 'Configurar Pasta' : 
                 !isConfigured ? 'Selecionar Pasta' : 'Reconectar'}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BackupStatus;
