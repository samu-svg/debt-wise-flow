
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Folder, HardDrive, Shield, ExternalLink, Lock } from 'lucide-react';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';

const BackupConfigModal = () => {
  const { 
    isSupported, 
    showConfigModal, 
    configureFolder,
    setShowConfigModal,
    isInIframe,
    isFirstAccess
  } = useFileSystemBackup();

  const handleConfigureFolder = async () => {
    const success = await configureFolder();
    if (!success && !isFirstAccess) {
      alert('Não foi possível configurar a pasta. Tente novamente.');
    }
  };

  const handleSkip = () => {
    if (isFirstAccess) {
      alert('A configuração da pasta é obrigatória para usar o sistema com segurança.');
      return;
    }
    setShowConfigModal(false);
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
            <DialogTitle className="flex items-center gap-2 text-red-600">
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
                <div className="bg-red-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-red-800 mb-2">
                    <strong>⚠️ Configuração Obrigatória</strong>
                  </p>
                  <p className="text-sm text-red-700">
                    Para garantir a segurança dos seus dados, é necessário usar um navegador compatível.
                  </p>
                </div>
                
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
              variant={isFirstAccess ? "outline" : "default"}
            >
              {isFirstAccess ? "Usar Backup Manual" : "Continuar sem Backup Automático"}
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
            <Lock className="w-5 h-5" />
            {isFirstAccess ? "Configuração Obrigatória" : "Configure o Backup Local"}
          </DialogTitle>
          <DialogDescription>
            {isFirstAccess 
              ? "Para garantir a segurança dos seus dados, configure uma pasta de backup"
              : "Seus dados serão salvos automaticamente no seu computador"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {isFirstAccess && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-orange-800 mb-2">
                  <Lock className="w-5 h-5" />
                  <h4 className="font-medium">Configuração Obrigatória</h4>
                </div>
                <p className="text-sm text-orange-700">
                  Por segurança, você deve configurar uma pasta local para backup dos seus dados antes de usar o sistema.
                </p>
              </CardContent>
            </Card>
          )}

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
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Como funciona:</h4>
                <p className="text-sm text-blue-700">
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
            
            {!isFirstAccess && (
              <Button 
                variant="outline" 
                onClick={handleSkip}
                className="w-full text-gray-600"
              >
                Pular (não recomendado)
              </Button>
            )}
          </div>

          {isFirstAccess && (
            <div className="text-center text-sm text-gray-500">
              <p>⚠️ Não é possível pular esta configuração</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BackupConfigModal;
