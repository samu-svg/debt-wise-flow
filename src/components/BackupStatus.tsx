
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
  Folder,
  Code,
  Lock
} from 'lucide-react';

const BackupStatus = () => {
  const { 
    isSupported, 
    isConfigured, 
    isConnected, 
    folderName,
    configureDirectory,
    isInIframe,
    isFirstAccess
  } = useFileSystemBackup();

  const getStatusInfo = () => {
    if (isInIframe) {
      return {
        icon: Code,
        color: 'bg-blue-500',
        text: 'Desenvolvimento',
        description: 'Use backup manual nos Relatórios'
      };
    }
    
    if (!isSupported) {
      return {
        icon: XCircle,
        color: 'bg-red-500',
        text: 'Não compatível',
        description: 'Navegador não suporta backup automático'
      };
    }

    if (isFirstAccess || (!isConfigured && isSupported)) {
      return {
        icon: Lock,
        color: 'bg-red-500',
        text: 'Obrigatório',
        description: 'Configure pasta para continuar'
      };
    }
    
    if (!isConfigured) {
      return {
        icon: AlertCircle,
        color: 'bg-orange-500',
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
      text: 'Configurada ✅',
      description: `Pasta: ${folderName}`
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleReconnect = async () => {
    if (!isSupported || isInIframe) {
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
            <HardDrive className="w-4 h-4" />
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
              statusInfo.color === 'bg-blue-500' ? 'text-blue-500' :
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
                <strong>⚠️ Configuração Obrigatória</strong>
              </p>
              <p className="text-xs text-red-600 mt-1">
                Configure uma pasta para usar o sistema com segurança
              </p>
            </div>
          )}
          
          {isConnected && folderName && !isInIframe && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Pasta:</strong> {folderName}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Backup automático ativo
              </p>
            </div>
          )}
          
          {isInIframe && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Modo Desenvolvimento</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Backup automático disponível após publicação
              </p>
            </div>
          )}
          
          {!isSupported && !isInIframe && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-600">
                Use Chrome ou Edge para backup automático
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            {(isFirstAccess || !isConfigured || !isConnected) && !isInIframe && (
              <Button 
                onClick={handleReconnect} 
                size="sm"
                className="flex items-center gap-2"
                variant={isFirstAccess ? "default" : "outline"}
              >
                <Folder className="w-4 h-4" />
                {isFirstAccess ? 'Configurar Agora' : 
                 !isConfigured ? 'Configurar' : 'Reconectar'}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {isInIframe ? 'Info' : 'Configurações'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BackupStatus;
