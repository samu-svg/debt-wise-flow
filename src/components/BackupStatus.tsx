
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/hooks/useAuth';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Settings,
  Folder,
  Lock,
  RefreshCw
} from 'lucide-react';

const BackupStatus = () => {
  const { user } = useAuth();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const { 
    isSupported, 
    isConfigured, 
    isConnected, 
    folderName,
    configureDirectory,
    isFirstAccess,
    loading
  } = useFileSystemBackup();

  const { restoreFromFolder } = useLocalStorage();

  // Auto-mostrar modal de configuração para novos usuários
  useEffect(() => {
    if (user && !loading && !isConfigured && isSupported) {
      const timer = setTimeout(() => {
        setShowConfigModal(true);
      }, 2000); // Aguarda 2 segundos após login
      return () => clearTimeout(timer);
    }
  }, [user, loading, isConfigured, isSupported]);

  const getStatusInfo = () => {
    if (loading) {
      return {
        icon: RefreshCw,
        color: 'bg-blue-500',
        text: 'Verificando...',
        description: 'Carregando configuração'
      };
    }
    
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

  const handleConfigure = async () => {
    if (!isSupported) {
      return;
    }
    
    try {
      const success = await configureDirectory();
      if (success) {
        setShowConfigModal(false);
      }
    } catch (error) {
      console.error('Erro ao configurar pasta:', error);
    }
  };

  const handleRestoreData = async () => {
    if (isConfigured && isConnected) {
      try {
        await restoreFromFolder();
        console.log('Dados restaurados da pasta com sucesso');
      } catch (error) {
        console.error('Erro ao restaurar dados:', error);
      }
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 px-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusInfo.color} ${loading ? 'animate-pulse' : ''}`} />
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
                statusInfo.color === 'bg-blue-500' ? 'text-blue-500' :
                'text-gray-500'
              } ${loading ? 'animate-spin' : ''}`} />
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
            
            <div className="flex gap-2 flex-wrap">
              {(isFirstAccess || !isConfigured || !isConnected) && (
                <Button 
                  onClick={handleConfigure} 
                  size="sm"
                  className="flex items-center gap-2"
                  variant={isFirstAccess ? "default" : "outline"}
                  disabled={loading}
                >
                  <Folder className="w-4 h-4" />
                  {loading ? 'Carregando...' :
                   isFirstAccess ? 'Configurar Pasta' : 
                   !isConfigured ? 'Selecionar Pasta' : 'Reconectar'}
                </Button>
              )}

              {isConfigured && isConnected && (
                <Button 
                  onClick={handleRestoreData}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Restaurar Dados
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setShowConfigModal(true)}
              >
                <Settings className="w-4 h-4" />
                Configurações
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Modal de configuração automático */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Configuração Inicial</h2>
            <p className="text-gray-600 mb-4">
              Para começar a usar o sistema, você precisa configurar uma pasta local 
              onde seus dados serão salvos automaticamente.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleConfigure} className="flex-1">
                <Folder className="w-4 h-4 mr-2" />
                Configurar Pasta
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowConfigModal(false)}
              >
                Depois
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BackupStatus;
