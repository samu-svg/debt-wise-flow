
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Folder, HardDrive, Shield, ExternalLink } from 'lucide-react';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';

const BackupConfigModal = () => {
  const { 
    isSupported, 
    showConfigModal, 
    configureFolder,
    setShowConfigModal,
    isInIframe
  } = useFileSystemBackup();

  const handleConfigureFolder = async () => {
    const success = await configureFolder();
    if (!success) {
      alert('Não foi possível configurar a pasta. Tente novamente.');
    }
  };

  // Se estamos em iframe (ambiente de desenvolvimento)
  if (isInIframe) {
    return (
      <Dialog open={showConfigModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Shield className="w-5 h-5" />
              Backup Local - Ambiente de Desenvolvimento
            </DialogTitle>
            <DialogDescription>
              Funcionalidade limitada no ambiente de desenvolvimento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Modo de Desenvolvimento Detectado</strong>
                  </p>
                  <p className="text-sm text-blue-700">
                    O backup automático funciona apenas no app publicado. Por enquanto, use a função "Fazer Backup" na seção Relatórios.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Após publicar seu app:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Backup automático funcionará normalmente</li>
                    <li>• Dados salvos localmente no seu PC</li>
                    <li>• Sincronização a cada alteração</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => setShowConfigModal(false)}
                className="w-full"
              >
                Entendi - Continuar
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.open('/app/reports', '_blank')}
                className="w-full flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ir para Relatórios (Backup Manual)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isSupported) {
    return (
      <Dialog open={showConfigModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Navegador Não Compatível
            </DialogTitle>
            <DialogDescription>
              Seu navegador não suporta backup local automático
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Para usar o backup automático, recomendamos:
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Google Chrome (versão 86+)</li>
                  <li>• Microsoft Edge (versão 86+)</li>
                </ul>
              </CardContent>
            </Card>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Alternativa:</strong> Use a função "Fazer Backup" na seção Relatórios para salvar seus dados manualmente.
              </p>
            </div>
            
            <Button 
              onClick={() => setShowConfigModal(false)} 
              className="w-full"
            >
              Continuar sem Backup Automático
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showConfigModal} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Shield className="w-5 h-5" />
            Configure o Backup Local
          </DialogTitle>
          <DialogDescription>
            Seus dados serão salvos automaticamente no seu computador
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-green-600" />
                Backup Automático
              </CardTitle>
              <CardDescription>
                Mantenha seus dados seguros no seu computador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Vantagens:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Backup automático a cada alteração</li>
                  <li>• Dados salvos localmente no seu PC</li>
                  <li>• Histórico de backups com data/hora</li>
                  <li>• Funciona offline</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Como funciona:</h4>
                <p className="text-sm text-yellow-700">
                  Escolha uma pasta no seu computador onde os backups serão salvos automaticamente. 
                  Os arquivos ficarão sempre atualizados.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleConfigureFolder}
              className="w-full flex items-center gap-2"
              size="lg"
            >
              <Folder className="w-4 h-4" />
              Escolher Pasta para Backup
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowConfigModal(false)}
              className="w-full text-gray-600"
            >
              Pular (não recomendado)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BackupConfigModal;
