
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';
import { toast } from '@/hooks/use-toast';
import { FolderOpen, AlertTriangle, RefreshCw, Download, Database, Info } from 'lucide-react';

interface BackupConfigModalProps {
  open: boolean;
  onConfigured: () => void;
}

const BackupConfigModal = ({ open, onConfigured }: BackupConfigModalProps) => {
  const { 
    isSupported, 
    configureDirectory, 
    loading, 
    lastError,
    errorSuggestions,
    clearError
  } = useFileSystemBackup();
  const [configuring, setConfiguring] = useState(false);

  const handleConfigure = async () => {
    setConfiguring(true);
    try {
      console.log('Tentando configurar pasta de dados...');
      clearError();
      const success = await configureDirectory();
      
      if (success) {
        toast({
          title: "Armazenamento configurado com sucesso!",
          description: isSupported 
            ? "Pasta local configurada para armazenar dados de clientes e dívidas." 
            : "Sistema configurado para salvar dados via download.",
        });
        onConfigured();
      } else {
        console.log('Configuração não foi concluída');
      }
    } catch (error) {
      console.error('Erro na configuração:', error);
      
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Erro na configuração",
          description: "Verifique as sugestões abaixo e tente novamente.",
          variant: "destructive",
        });
      } else {
        console.log('Usuário cancelou a seleção');
      }
    } finally {
      setConfiguring(false);
    }
  };

  const handleRetry = () => {
    console.log('Tentando novamente...');
    clearError();
    handleConfigure();
  };

  const handleSkip = () => {
    console.log('Usuário optou por usar modo download');
    onConfigured();
  };

  if (loading) {
    return null;
  }

  // Se há erro de segurança (iframe), mostrar informação especial
  const isSecurityError = lastError?.code === 'SecurityError';

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Configuração de Armazenamento Local
          </DialogTitle>
          <DialogDescription>
            Configure onde salvar os dados de clientes e dívidas. 
            Os dados serão salvos automaticamente a cada alteração.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Display */}
          {lastError && (
            <Alert variant={isSecurityError ? "default" : "destructive"}>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    {isSecurityError ? 
                      'Modo Desenvolvimento Detectado' : 
                      lastError.message
                    }
                  </p>
                  {errorSuggestions.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">
                        {isSecurityError ? 'Informação:' : 'Sugestões para resolver:'}
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {errorSuggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Status Cards */}
          {isSecurityError ? (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Modo Desenvolvimento</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Dados serão salvos via download por questões de segurança.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isSupported ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Armazenamento Local Disponível</p>
                    <p className="text-sm text-green-700 mt-1">
                      Dados serão salvos diretamente na pasta selecionada.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Modo Download</p>
                    <p className="text-sm text-orange-700 mt-1">
                      Dados salvos via download. Use Chrome/Edge para melhor experiência.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {isSecurityError ? (
              <Button 
                onClick={handleSkip}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Usar Modo Download
              </Button>
            ) : lastError && lastError.retry ? (
              <div className="flex gap-2">
                <Button 
                  onClick={handleRetry}
                  disabled={configuring}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {configuring ? 'Tentando...' : 'Tentar Novamente'}
                </Button>
                <Button 
                  onClick={handleSkip}
                  variant="outline"
                >
                  Usar Download
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleConfigure}
                disabled={configuring}
                className="w-full"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                {configuring ? 'Configurando...' : 
                 isSupported ? 'Selecionar Pasta para Dados' : 'Configurar Armazenamento'}
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">Por que configurar armazenamento local?</p>
              <p>• Dados de clientes e dívidas ficam no seu computador</p>
              <p>• Sincronização automática a cada alteração</p>
              <p>• Controle total sobre dados sensíveis</p>
              <p>• Acesso aos arquivos mesmo offline</p>
              <p>• Backup automático dos dados importantes</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BackupConfigModal;
