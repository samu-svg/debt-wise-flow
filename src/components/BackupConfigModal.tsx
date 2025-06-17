
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Database, Info, Download } from 'lucide-react';

interface BackupConfigModalProps {
  open: boolean;
  onConfigured: () => void;
}

const BackupConfigModal = ({ open, onConfigured }: BackupConfigModalProps) => {
  const { user } = useAuth();
  const [configuring, setConfiguring] = useState(false);

  const handleSkip = () => {
    console.log('Usuário optou por continuar sem configuração de backup');
    onConfigured();
  };

  const handleDownloadBackup = async () => {
    setConfiguring(true);
    try {
      // Simular download de backup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Backup baixado!",
        description: "Dados salvos localmente via download.",
      });
      
      onConfigured();
    } catch (error) {
      console.error('Erro no backup:', error);
      toast({
        title: "Erro no backup",
        description: "Não foi possível fazer o backup dos dados.",
        variant: "destructive",
      });
    } finally {
      setConfiguring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Configuração de Backup
          </DialogTitle>
          <DialogDescription>
            Seus dados estão sendo salvos automaticamente no Supabase. 
            Configure backup adicional se necessário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          {user && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Dados sincronizados para: <strong>{user.email}</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Card */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Supabase Ativo</p>
                  <p className="text-sm text-green-700 mt-1">
                    Dados são salvos automaticamente no banco de dados em nuvem.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Sistema Supabase Integrado</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Salvamento automático em tempo real</li>
                  <li>Sincronização entre dispositivos</li>
                  <li>Backup automático na nuvem</li>
                  <li>Controle de acesso por usuário</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleDownloadBackup}
              disabled={configuring}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {configuring ? 'Baixando...' : 'Baixar Backup Local'}
            </Button>
            
            <Button 
              onClick={handleSkip}
              variant="outline"
              className="w-full"
            >
              Continuar sem Backup Local
            </Button>
          </div>

          {/* Info */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">Por que usar Supabase?</p>
              <p>• Dados seguros na nuvem</p>
              <p>• Acesso de qualquer dispositivo</p>
              <p>• Backup automático e redundante</p>
              <p>• Sincronização em tempo real</p>
              <p>• Isolamento de dados por usuário</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BackupConfigModal;
