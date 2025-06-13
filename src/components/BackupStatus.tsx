
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';
import { 
  HardDrive, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Settings,
  Folder
} from 'lucide-react';

const BackupStatus = () => {
  const { 
    isSupported, 
    isConfigured, 
    isConnected, 
    folderName,
    configureFolder,
    setShowConfigModal
  } = useFileSystemBackup();

  const getStatusInfo = () => {
    if (!isSupported) {
      return {
        icon: XCircle,
        color: 'bg-gray-500',
        text: 'Não suportado',
        description: 'Navegador não compatível'
      };
    }
    
    if (!isConfigured) {
      return {
        icon: AlertCircle,
        color: 'bg-yellow-500',
        text: 'Não configurado',
        description: 'Configure uma pasta para backup'
      };
    }
    
    if (!isConnected) {
      return {
        icon: AlertCircle,
        color: 'bg-orange-500',
        text: 'Desconectado',
        description: 'Reconecte à pasta de backup'
      };
    }
    
    return {
      icon: CheckCircle,
      color: 'bg-green-500',
      text: 'Conectado',
      description: `Salvando em: ${folderName}`
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleReconnect = async () => {
    if (!isSupported) {
      setShowConfigModal(true);
      return;
    }
    
    await configureFolder();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 px-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
            <HardDrive className="w-4 h-4" />
          </div>
          <Badge variant="outline" className="text-xs">
            Backup
          </Badge>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-5 h-5 ${
              statusInfo.color === 'bg-green-500' ? 'text-green-500' :
              statusInfo.color === 'bg-yellow-500' ? 'text-yellow-500' :
              statusInfo.color === 'bg-orange-500' ? 'text-orange-500' :
              'text-gray-500'
            }`} />
            <div>
              <p className="font-medium">{statusInfo.text}</p>
              <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
            </div>
          </div>
          
          {isConnected && folderName && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Pasta:</strong> {folderName}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Backup automático ativo
              </p>
            </div>
          )}
          
          {!isSupported && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Use Chrome ou Edge para backup automático
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            {(!isConfigured || !isConnected) && (
              <Button 
                onClick={handleReconnect} 
                size="sm"
                className="flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                {!isConfigured ? 'Configurar' : 'Reconectar'}
              </Button>
            )}
            
            {isSupported && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowConfigModal(true)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Configurações
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BackupStatus;
