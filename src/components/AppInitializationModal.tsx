
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';
import { useAuth } from '@/hooks/useAuth';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { toast } from '@/hooks/use-toast';
import { 
  FolderOpen, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  User,
  CheckCircle,
  Settings
} from 'lucide-react';

const AppInitializationModal = () => {
  const { user } = useAuth();
  const { 
    isSupported, 
    configureDirectory, 
    loading 
  } = useFileSystemBackup();
  const { 
    isInitializing,
    needsConfiguration,
    configError,
    autoReconnectAttempted,
    markFolderConfigured,
    resetConfiguration,
    retry
  } = useAppInitialization();
  
  const [configuring, setConfiguring] = useState(false);

  const handleConfigure = async () => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para configurar o armazenamento.",
        variant: "destructive",
      });
      return;
    }

    setConfiguring(true);
    try {
      console.log('Configurando pasta para usuário:', user.email);
      const success = await configureDirectory();
      
      if (success) {
        // Marcar como configurado no sistema de inicialização
        await markFolderConfigured('configured');
        
        toast({
          title: "Configuração salva com sucesso!",
          description: "Sua pasta foi configurada e será reconectada automaticamente nos próximos logins.",
        });
      }
    } catch (error) {
      console.error('Erro na configuração:', error);
      
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Erro na configuração",
          description: "Não foi possível configurar a pasta. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setConfiguring(false);
    }
  };

  const handleRetry = () => {
    retry();
  };

  const handleReset = () => {
    resetConfiguration();
  };

  // Não mostrar modal se não precisar de configuração ou se estiver inicializando
  if (!needsConfiguration || isInitializing) {
    return null;
  }

  return (
    <Dialog open={needsConfiguration} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            {autoReconnectAttempted ? 'Reconfiguração Necessária' : 'Configuração Inicial'}
          </DialogTitle>
          <DialogDescription>
            {autoReconnectAttempted 
              ? 'A pasta configurada anteriormente não está mais acessível. Configure uma nova pasta para continuar.'
              : 'Configure onde salvar os dados. Esta configuração será lembrada e reconectada automaticamente.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          {user && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Configurando para: <strong>{user.email}</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Cards */}
          {autoReconnectAttempted && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Reconexão Falhou</p>
                    <p className="text-sm text-orange-700 mt-1">
                      A pasta configurada anteriormente não está mais acessível ou foi movida.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {configError && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Erro na inicialização:</p>
                  <p className="text-sm">{configError}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isSupported ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Sistema Suportado</p>
                    <p className="text-sm text-green-700 mt-1">
                      Configuração única com reconexão automática nos próximos acessos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Navegador Não Suportado</p>
                    <p className="text-sm text-orange-700 mt-1">
                      Use Chrome, Edge ou outro navegador baseado em Chromium para melhor experiência.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {configError ? (
              <div className="flex gap-2">
                <Button 
                  onClick={handleRetry}
                  disabled={isInitializing}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isInitializing ? 'Tentando...' : 'Tentar Novamente'}
                </Button>
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  disabled={isInitializing}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleConfigure}
                disabled={configuring || !user || !isSupported}
                className="w-full"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                {configuring ? 'Configurando...' : 
                 isSupported ? 'Selecionar Pasta' : 'Configuração Não Disponível'}
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">Como funciona a configuração:</p>
              <p>• Configuração salva automaticamente na sua conta</p>
              <p>• Reconexão automática a cada login</p>
              <p>• Dados organizados por usuário na pasta escolhida</p>
              <p>• Validação de integridade na inicialização</p>
              <p>• Recovery automático em caso de problemas</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppInitializationModal;
