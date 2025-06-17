
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { useDataManager } from '@/hooks/useDataManager';
import { 
  Database, 
  CheckCircle, 
  Wifi,
  RefreshCw,
  Download,
  User
} from 'lucide-react';

const BackupStatus = () => {
  const { user } = useAuth();
  const { exportData, loading } = useDataManager();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-supabase-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Backup baixado com sucesso');
    } catch (error) {
      console.error('Erro ao baixar backup:', error);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusInfo = () => {
    if (loading) {
      return {
        icon: RefreshCw,
        color: 'bg-blue-500',
        text: 'Sincronizando...',
        description: 'Carregando dados do Supabase'
      };
    }
    
    if (!user) {
      return {
        icon: User,
        color: 'bg-red-500',
        text: 'Não Logado',
        description: 'Faça login para acessar seus dados'
      };
    }
    
    return {
      icon: Wifi,
      color: 'bg-green-500',
      text: 'Supabase Online ✅',
      description: 'Dados sincronizados automaticamente'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
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
              statusInfo.color === 'bg-blue-500' ? 'text-blue-500' :
              'text-red-500'
            } ${loading ? 'animate-spin' : ''}`} />
            <div>
              <p className="font-medium">{statusInfo.text}</p>
              <p className="text-xs text-gray-600">{statusInfo.description}</p>
            </div>
          </div>

          {user && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Conectado como: <strong>{user.email}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Status do Sistema</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Banco de Dados:</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
              <div className="flex justify-between">
                <span>Sincronização:</span>
                <span className="text-green-600 font-medium">Automática</span>
              </div>
              <div className="flex justify-between">
                <span>Backup:</span>
                <span className="text-green-600 font-medium">Redundante</span>
              </div>
            </div>
          </div>

          {user && (
            <Button 
              onClick={handleDownloadBackup}
              disabled={downloading}
              size="sm"
              className="w-full"
            >
              <Download className={`w-4 h-4 mr-2 ${downloading ? 'animate-bounce' : ''}`} />
              {downloading ? 'Baixando...' : 'Baixar Backup Local'}
            </Button>
          )}

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">Recursos Supabase:</p>
              <p>• Dados seguros em tempo real</p>
              <p>• Backup automático na nuvem</p>
              <p>• Acesso de qualquer dispositivo</p>
              <p>• Isolamento total por usuário</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BackupStatus;
