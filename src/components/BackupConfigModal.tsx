
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';
import { toast } from '@/hooks/use-toast';
import { FolderOpen, AlertTriangle, Chrome } from 'lucide-react';

interface BackupConfigModalProps {
  open: boolean;
  onConfigured: () => void;
}

const BackupConfigModal = ({ open, onConfigured }: BackupConfigModalProps) => {
  const { isSupported, configureDirectory, loading } = useFileSystemBackup();
  const [configuring, setConfiguring] = useState(false);

  const handleConfigure = async () => {
    if (!isSupported) {
      toast({
        title: "Navegador não suportado",
        description: "Use Chrome, Edge ou outro navegador baseado em Chromium para acessar esta funcionalidade.",
        variant: "destructive",
      });
      return;
    }

    setConfiguring(true);
    try {
      await configureDirectory();
      toast({
        title: "Pasta configurada!",
        description: "Sistema configurado para salvar backups localmente.",
      });
      onConfigured();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao configurar pasta:', error);
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

  if (loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            Configuração Obrigatória
          </DialogTitle>
          <DialogDescription>
            Para usar o sistema, você deve configurar uma pasta local para salvar os backups automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isSupported ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Navegador não suportado</p>
                    <p className="text-sm text-red-700 mt-1">
                      Use Chrome, Edge ou outro navegador baseado em Chromium.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Chrome className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Sistema de Backup Local</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Selecione uma pasta onde os backups serão salvos automaticamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleConfigure}
              disabled={!isSupported || configuring}
              className="w-full"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {configuring ? 'Configurando...' : 'Selecionar Pasta'}
            </Button>
            
            {!isSupported && (
              <p className="text-xs text-center text-gray-600">
                Você não poderá usar o sistema sem configurar uma pasta de backup.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BackupConfigModal;
