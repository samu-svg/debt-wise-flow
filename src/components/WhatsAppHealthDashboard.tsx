
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { useWhatsAppHealthMonitor } from '@/hooks/useWhatsAppHealthMonitor';
import { 
  Activity, 
  Heart, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Zap,
  Timer,
  TrendingUp,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

const WhatsAppHealthDashboard = () => {
  const { config } = useWhatsAppCloudAPI();
  const { healthStatus, isMonitoring, startMonitoring, stopMonitoring, forceHealthCheck } = useWhatsAppHealthMonitor();

  // Auto-iniciar monitoramento se houver configuração
  useEffect(() => {
    if (config.accessToken && config.phoneNumberId && !isMonitoring) {
      startMonitoring(config);
    }
  }, [config, isMonitoring, startMonitoring]);

  const formatUptime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Nunca';
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  const getHealthBadge = () => {
    if (!healthStatus.lastCheck) {
      return <Badge variant="outline">Não testado</Badge>;
    }
    
    if (healthStatus.isHealthy) {
      return <Badge className="bg-green-100 text-green-800">Saudável</Badge>;
    } else {
      return <Badge variant="destructive">Com problemas</Badge>;
    }
  };

  const getStatusIcon = () => {
    if (healthStatus.isHealthy) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (healthStatus.lastCheck) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else {
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Status de Saúde da API
              </CardTitle>
              <CardDescription>
                Monitoramento contínuo da conectividade WhatsApp Cloud API
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getHealthBadge()}
              {getStatusIcon()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm">
                  Monitoramento: {isMonitoring ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              {healthStatus.lastCheck && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  Último check: {formatTimestamp(healthStatus.lastCheck)}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => forceHealthCheck(config)}
                className="flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Testar agora
              </Button>
              
              {isMonitoring ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopMonitoring}
                  className="flex items-center gap-1"
                >
                  <Pause className="w-3 h-3" />
                  Parar
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => startMonitoring(config)}
                  disabled={!config.accessToken || !config.phoneNumberId}
                  className="flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Iniciar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-500" />
              Tempo de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {healthStatus.responseTime}ms
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Última medição
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatUptime(healthStatus.uptime)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tempo ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Taxa de Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {healthStatus.errorRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Últimas verificações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Falhas Consecutivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {healthStatus.consecutiveFailures}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {healthStatus.consecutiveFailures >= 3 ? 'Crítico!' : 'Normal'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Recomendações */}
      {healthStatus.consecutiveFailures >= 2 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Alerta de Conectividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-700">
              <p className="mb-2">
                Detectadas {healthStatus.consecutiveFailures} falhas consecutivas na conexão.
              </p>
              <div className="text-sm">
                <p className="font-medium mb-1">Ações recomendadas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verifique se o Access Token está válido</li>
                  <li>Confirme se o Phone Number ID está correto</li>
                  <li>Teste a conectividade com a internet</li>
                  <li>Verifique se não há limites de API atingidos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!healthStatus.lastCheck && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              Configuração Necessária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              Configure suas credenciais do WhatsApp na aba "Configurações" 
              para começar o monitoramento de saúde da API.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppHealthDashboard;
