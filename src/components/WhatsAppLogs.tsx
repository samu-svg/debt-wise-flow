
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { 
  Trash2, 
  Download, 
  Filter,
  MessageSquare,
  Zap,
  AlertTriangle,
  Info,
  Webhook
} from 'lucide-react';
import { WhatsAppLog } from '@/types/whatsapp';

const logTypeConfig = {
  connection: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50', variant: 'secondary' as const },
  message: { icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50', variant: 'default' as const },
  error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', variant: 'destructive' as const },
  system: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50', variant: 'outline' as const },
  webhook: { icon: Webhook, color: 'text-purple-500', bg: 'bg-purple-50', variant: 'secondary' as const }
};

const WhatsAppLogs = () => {
  const { logs, clearLogs } = useWhatsAppCloudAPI();
  const [filter, setFilter] = useState<WhatsAppLog['type'] | 'all'>('all');

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter);

  const exportLogs = () => {
    const logData = {
      exportDate: new Date().toISOString(),
      totalLogs: logs.length,
      systemType: 'whatsapp-cloud-api',
      logs: logs
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-cloud-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Logs da WhatsApp Cloud API
            </CardTitle>
            <CardDescription>
              {logs.length} registros • Atividades da API e eventos do sistema
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex items-center gap-2"
          >
            <Filter className="w-3 h-3" />
            Todos ({logs.length})
          </Button>
          {Object.entries(logTypeConfig).map(([type, config]) => {
            const count = logs.filter(log => log.type === type).length;
            const Icon = config.icon;
            return (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type as WhatsAppLog['type'])}
                className="flex items-center gap-2"
              >
                <Icon className="w-3 h-3" />
                {type} ({count})
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96 w-full">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log encontrado</p>
              <p className="text-sm">Os eventos da WhatsApp Cloud API aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.slice().reverse().map((log) => {
                const config = logTypeConfig[log.type];
                const Icon = config.icon;
                
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border ${config.bg} hover:shadow-sm transition-shadow`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-4 h-4 mt-0.5 ${config.color} flex-shrink-0`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={config.variant} className="text-xs">
                            {log.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-800 break-words">
                          {log.message}
                        </p>
                        
                        {log.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                              Ver detalhes
                            </summary>
                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default WhatsAppLogs;
