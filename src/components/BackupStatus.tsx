
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
  RefreshCw,
  Wifi,
  WifiOff
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
    loading,
    reconnecting,
    attemptAutoReconnect,
    resetConfiguration
  } = useFileSystemBackup();

  const { restoreFromFolder } = useLocalStorage();

  // Auto-mostrar modal de configuração para novos usuários
  useEffect(() => {
    if (user && !loading && !reconnecting && !isConfigured && isSupported) {
      const timer = setTimeout(() => {
        setShowConfigModal(true);
      }, 3000); // Aguarda 3 segundos após login para dar tempo da reconexão automática
      return () => clearTimeout(timer);
    }
  }, [user, loading, reconnecting, isConfigured, isSupported]);

  const getStatusInfo = () => {
    if (loading) {
      return {
        icon: RefreshCw,
        color: 'bg-blue-500',
        text: 'Inicializando...',
        description: 'Carregando configuração do sistema'
      };
    }

    if (reconnecting) {
      return {
        icon: RefreshCw,
        color: 'bg-blue-500',
        text: 'Reconectando...',
        description: 'Tentando reconectar à pasta configurada automaticamente'
      };
    }
    
    if (!isSupported) {
      return {
        icon: XCircle,
        color: 'bg-red-500',
        text: 'Sistema Não Suportado',
        description: 'File System API não disponível neste navegador'
      };
    }
    
    if (isFirstAccess || !isConfigured) {
      return {
        icon: Lock,
        color: 'bg-red-500',
        text: 'Configuração Necessária',
        description: 'Configure pasta para salvamento automático'
      };
    }
    
    if (!isConnected) {
      return {
        icon: WifiOff,
        color: 'bg-orange-500',
        text: 'Pasta Desconectada',
        description: 'Tente reconectar ou selecione uma nova pasta'
      };
    }
    
    return {
      icon: Wifi,
      color: 'bg-green-500',
      text: 'Conectado ✅',
      description: `Salvamento automático ativo em: ${folderName}`
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

  const handleReconnect = async () => {
    if (user && isSupported) {
      try {
        await attemptAutoReconnect();
      } catch (error) {
        console.error('Erro ao reconectar:', error);
      }
    }
  };

  const handleResetAndConfigure = async () => {
    if (user && isSupported) {
      try {
        await resetConfiguration();
        setTimeout(() => {
          handleConfigure();
        }, 500);
      } catch (error) {
        console.error('Erro ao resetar configuração:', error);
      }
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
              <div className={`w-2 h-2 rounded-full ${statusInfo.color} ${loading || reconnecting ? 'animate-pulse' : ''}`} />
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
              } ${loading || reconnecting ? 'animate-spin' : ''}`} />
              <div>
                <p className="font-medium">{statusInfo.text}</p>
                <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
              </div>
            </div>

            {!isSupported && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>❌ Navegador Não Suportado</strong>
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Use um navegador baseado em Chromium (Chrome, Edge, Opera) para acesso à pasta local
                </p>
              </div>
            )}

            {isSupported && (isFirstAccess || !isConfigured) && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>📁 Configuração de Pasta</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Configure uma pasta para salvamento automático. A configuração fica salva na sua conta.
                </p>
              </div>
            )}

            {isConfigured && !isConnected && !reconnecting && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>⚠️ Pasta Desconectada</strong>
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  A pasta configurada não está mais acessível. Tente reconectar ou configure uma nova.
                </p>
              </div>
            )}
            
            {isConnected && folderName && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>✅ Pasta Conectada:</strong> {folderName}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Salvamento automático ativo. Dados são salvos automaticamente a cada alteração.
                </p>
              </div>
            )}
            
            {reconnecting && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>🔄 Reconexão Automática Ativa</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Sistema tentando reconectar automaticamente à pasta configurada anteriormente.
                </p>
              </div>
            )}
            
            <div className="flex gap-2 flex-wrap">
              {isSupported && (isFirstAccess || !isConfigured) && !reconnecting && (
                <Button 
                  onClick={handleConfigure} 
                  size="sm"
                  className="flex items-center gap-2"
                  variant={isFirstAccess ? "default" : "outline"}
                  disabled={loading || reconnecting}
                >
                  <Folder className="w-4 h-4" />
                  {loading || reconnecting ? 'Aguarde...' : 'Configurar Pasta'}
                </Button>
              )}

              {isConfigured && !isConnected && isSupported && !reconnecting && (
                <>
                  <Button 
                    onClick={handleReconnect}
                    size="sm"
                    variant="default"
                    className="flex items-center gap-2"
                    disabled={loading || reconnecting}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reconectar
                  </Button>
                  <Button 
                    onClick={handleResetAndConfigure}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={loading || reconnecting}
                  >
                    <Folder className="w-4 h-4" />
                    Nova Pasta
                  </Button>
                </>
              )}

              {isConfigured && isConnected && (
                <Button 
                  onClick={handleRestoreData}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={loading || reconnecting}
                >
                  <RefreshCw className="w-4 h-4" />
                  Restaurar da Pasta
                </Button>
              )}
              
              {isSupported && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setShowConfigModal(true)}
                  disabled={loading || reconnecting}
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Modal de configuração automático */}
      {showConfigModal && isSupported && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Configuração da Pasta</h2>
            <p className="text-gray-600 mb-4">
              Configure uma pasta local para salvamento automático dos seus dados. 
              A configuração fica salva na sua conta e reconecta automaticamente.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>🔄 Reconexão Automática</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Após configurar, a pasta será lembrada e reconectada automaticamente 
                nos próximos acessos, sem precisar selecionar novamente.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleConfigure} 
                className="flex-1"
                disabled={loading || reconnecting}
              >
                <Folder className="w-4 h-4 mr-2" />
                {loading || reconnecting ? 'Aguarde...' : 'Configurar Pasta'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowConfigModal(false)}
                disabled={loading || reconnecting}
              >
                Depois
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Aviso para navegadores não suportados */}
      {showConfigModal && !isSupported && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Navegador Não Suportado</h2>
            <p className="text-gray-600 mb-4">
              O sistema de pasta local requer um navegador baseado em Chromium para funcionar.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>📦 Navegadores Recomendados:</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                • Google Chrome<br/>
                • Microsoft Edge<br/>
                • Opera<br/>
                • Brave
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowConfigModal(false)}
                className="flex-1"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BackupStatus;
