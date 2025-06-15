
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
  Webhook,
  Search,
  RefreshCw
} from 'lucide-react';
import { WhatsAppLog } from '@/types/whatsapp';

const logTypeConfig = {
  connection: { 
    icon: Zap, 
    color: 'text-blue-500', 
    bg: 'bg-blue-50', 
    variant: 'secondary' as const,
    label: 'Conexão'
  },
  message: { 
    icon: MessageSquare, 
    color: 'text-green-500', 
    bg: 'bg-green-50', 
    variant: 'default' as const,
    label: 'Mensagem'
  },
  error: { 
    icon: AlertTriangle, 
    color: 'text-red-500', 
    bg: 'bg-red-50', 
    variant: 'destructive' as const,
    label: 'Erro'
  },
  system: { 
    icon: Info, 
    color: 'text-gray-500', 
    bg: 'bg-gray-50', 
    variant: 'outline' as const,
    label: 'Sistema'
  },
  webhook: { 
    icon: Webhook, 
    color: 'text-purple-500', 
    bg: 'bg-purple-50', 
    variant: 'secondary' as const,
    label: 'Webhook'
  }
};

const WhatsAppLogs = () => {
  const { logs, clearLogs } = useWhatsAppCloudAPI();
  const [filter, setFilter] = useState<WhatsAppLog['type'] | 'all'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter);

  const exportLogs = async () => {
    setIsExporting(true);
    try {
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
    } finally {
      setIsExporting(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Logs da WhatsApp Cloud API
            </CardTitle>
            <CardDescription className="text-sm">
              {logs.length} registros • Atividades da API e eventos do sistema
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              disabled={logs.length === 0 || isExporting}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-2 text-xs sm:text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Limpar</span>
            </Button>
          </div>
        </div>

        {/* Filtros - Mobile Optimized */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex items-center gap-1 text-xs"
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
                className="flex items-center gap-1 text-xs"
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{config.label}</span>
                <span className="sm:hidden">{type.charAt(0).toUpperCase()}</span>
                ({count})
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-80 sm:h-96 w-full">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
              <p className="text-gray-600 mb-2">Nenhum log encontrado</p>
              <p className="text-sm text-gray-500">Os eventos da WhatsApp Cloud API aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredLogs.slice().reverse().map((log) => {
                const config = logTypeConfig[log.type];
                const Icon = config.icon;
                
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border transition-all hover:shadow-sm ${config.bg} border-gray-200`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <Badge 
                            variant={config.variant} 
                            className="text-xs w-fit"
                          >
                            {config.label}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm break-words text-gray-700 leading-relaxed">
                          {log.message}
                        </p>
                        
                        {log.data && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-gray-500 hover:text-gray-700">
                              Ver detalhes
                            </summary>
                            <pre className="mt-1 text-xs p-2 rounded bg-white/50 border overflow-x-auto text-gray-600">
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
