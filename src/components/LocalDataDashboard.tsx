
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalDataManager } from '@/hooks/useLocalDataManager';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';
import { 
  Users, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Upload,
  Database,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const LocalDataDashboard = () => {
  const { statistics, exportData, importData, refresh, restoreFromFolder } = useLocalDataManager();
  const { isConnected, folderName, downloadBackup, restoreFromFolder: restoreFromBackup } = useFileSystemBackup();

  // Export manual via download
  const handleExport = async () => {
    try {
      const data = exportData();
      const filename = `debt_manager_export_${new Date().toISOString().split('T')[0]}.json`;
      
      if (downloadBackup) {
        await downloadBackup(data, filename);
      } else {
        // Fallback para download tradicional
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Dados exportados",
        description: "Arquivo de backup baixado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const success = await importData(text);
          if (success) {
            toast({
              title: "Dados importados",
              description: "Backup restaurado com sucesso!",
            });
            refresh();
          } else {
            toast({
              title: "Erro na importação",
              description: "Arquivo inválido ou corrompido.",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Erro na importação",
            description: "Não foi possível ler o arquivo.",
            variant: "destructive",
          });
        }
      }
    };
    input.click();
  };

  // Restaurar da pasta local
  const handleRestoreFromFolder = async () => {
    if (!isConnected) {
      toast({
        title: "Pasta não conectada",
        description: "Configure uma pasta local primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Tentando restaurar da pasta...');
      const backupData = await restoreFromBackup();
      const success = await importData(JSON.stringify(backupData));
      
      if (success) {
        toast({
          title: "Dados restaurados",
          description: "Backup da pasta restaurado com sucesso!",
        });
        refresh();
      } else {
        toast({
          title: "Erro na restauração",
          description: "Dados da pasta inválidos.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na restauração",
        description: error.message || "Não foi possível restaurar da pasta.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Armazenamento Local</h2>
          <p className="text-gray-600">Gestão de dados locais e backups</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleImport} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          {isConnected && (
            <Button onClick={handleRestoreFromFolder} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restaurar da Pasta
            </Button>
          )}
        </div>
      </div>

      {/* Status do Armazenamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Status do Armazenamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-orange-500'}`} />
              <span className="text-sm">
                {isConnected ? `📁 Pasta: ${folderName}` : '💾 Apenas localStorage'}
              </span>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? 'Sincronização Ativa' : 'Local Apenas'}
            </Badge>
          </div>
          {isConnected && (
            <p className="text-xs text-green-600 mt-2">
              ✅ Dados salvos automaticamente na pasta local a cada alteração
            </p>
          )}
          {!isConnected && (
            <p className="text-xs text-orange-600 mt-2">
              ⚠️ Configure uma pasta para backup automático
            </p>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalDebts}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {statistics.pendingDebts} pendentes
              </Badge>
              <Badge variant="destructive" className="text-xs">
                {statistics.overdueDebts} atrasadas
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {statistics.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              em dívidas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.messagesTotal}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.messagesSent} enviadas com sucesso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes por Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Clock className="w-4 h-4" />
              Pendentes
            </CardTitle>
            <CardDescription>Dívidas aguardando pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statistics.pendingDebts}
            </div>
            <p className="text-sm text-gray-600">dívidas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              Atrasadas
            </CardTitle>
            <CardDescription>Dívidas vencidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics.overdueDebts}
            </div>
            <p className="text-sm text-gray-600">
              R$ {statistics.overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              Pagas
            </CardTitle>
            <CardDescription>Dívidas quitadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.paidDebts}
            </div>
            <p className="text-sm text-gray-600">dívidas quitadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>
            Detalhes sobre o armazenamento e sincronização de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Armazenamento Local:</span>
            <Badge variant="outline">✅ Ativo (localStorage)</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Backup na Pasta:</span>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? '✅ Ativado' : '❌ Desativado'}
            </Badge>
          </div>
          {isConnected && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pasta de Backup:</span>
              <span className="text-sm font-medium">📁 {folderName}</span>
            </div>
          )}
          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500">
              • 💾 Dados sempre salvos no navegador (localStorage)
              <br />
              {isConnected ? (
                <>
                  • 📁 Backup automático na pasta: {folderName}
                  <br />
                  • 🔄 Sincronização a cada alteração (sem downloads)
                  <br />
                </>
              ) : (
                '• ⚠️ Configure uma pasta para backup automático\n'
              )}
              • 📥 Use "Exportar" para download manual
              <br />
              • 🔄 Use "Restaurar da Pasta" para recuperar backups
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocalDataDashboard;
