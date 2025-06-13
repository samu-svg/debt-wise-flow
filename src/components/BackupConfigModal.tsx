
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';
import { toast } from '@/hooks/use-toast';
import { FolderOpen, AlertTriangle, Chrome, RefreshCw, Download } from 'lucide-react';

interface BackupConfigModalProps {
  open: boolean;
  onConfigured: () => void;
}

const BackupConfigModal = ({ open, onConfigured }: BackupConfigModalProps) => {
  const { 
    isSupported, 
    configureDirectory, 
    loading, 
    isInIframe,
    lastError,
    errorSuggestions,
    clearError
  } = useFileSystemBackup();
  const [configuring, setConfiguring] = useState(false);

  const handleConfigure = async () => {
    setConfiguring(true);
    try {
      clearError();
      await configureDirectory();
      toast({
        title: "Sistema configurado!",
        description: isSupported 
          ? "Pasta configurada para backup automático." 
          : "Sistema configurado para download manual.",
      });
      onConfigured();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Erro ao configurar:', error);
        toast({
          title: "Erro na configuração",
          description: "Verifique as sugestões abaixo e tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setConfiguring(false);
    }
  };

  const handleRetry = () => {
    clearError();
    handleConfigure();
  };

  if (loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            {isInIframe ? 'Modo Desenvolvimento' : 'Configuração de Backup'}
          </DialogTitle>
          <DialogDescription>
            {isInIframe 
              ? 'No modo desenvolvimento, use backup manual. Após publicação, configure uma pasta para backup automático.'
              : 'Configure o sistema de backup para usar o Debt Wise Flow com segurança.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Display */}
          {lastError && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{lastError.message}</p>
                  {errorSuggestions.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Sugestões:</p>
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
          {isInIframe ? (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Chrome className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Modo Desenvolvimento Ativo</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Backup via download disponível. Backup automático após publicação.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : !isSupported ? (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Modo Compatibilidade</p>
                    <p className="text-sm text-orange-700 mt-1">
                      Backup via download automático. Use Chrome/Edge para melhor experiência.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Sistema Completo Disponível</p>
                    <p className="text-sm text-green-700 mt-1">
                      Selecione uma pasta para backup automático direto.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {lastError && lastError.retry ? (
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
                  onClick={onConfigured}
                  variant="outline"
                >
                  Pular
                </Button>
              </div>
            ) : (
              <Button 
                onClick={isInIframe ? onConfigured : handleConfigure}
                disabled={configuring}
                className="w-full"
              >
                {isInIframe ? (
                  <>
                    <Chrome className="w-4 h-4 mr-2" />
                    Continuar (Desenvolvimento)
                  </>
                ) : (
                  <>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {configuring ? 'Configurando...' : 
                     isSupported ? 'Selecionar Pasta' : 'Configurar Download'}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">Sistema Inteligente de Backup:</p>
              <p>• Detecta automaticamente as capacidades do seu navegador</p>
              <p>• Usa método mais seguro disponível</p>
              <p>• Fallback automático para download se necessário</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BackupConfigModal;
