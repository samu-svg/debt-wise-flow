
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCollectionAutomation } from '@/hooks/useCollectionAutomation';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { toast } from '@/hooks/use-toast';
import {
  Zap,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Settings
} from 'lucide-react';

const AutomationDashboard = () => {
  const { 
    config, 
    stats, 
    communications, 
    isProcessing, 
    updateConfig, 
    processAutomaticCollections 
  } = useCollectionAutomation();
  
  const { dividas, loading } = useSupabaseData();

  // Calcular dívidas vencidas
  const overdueDebts = dividas.filter(debt => {
    if (debt.status === 'pago') return false;
    const dueDate = new Date(debt.data_vencimento || '');
    return dueDate < new Date();
  });

  const handleToggleAutomation = (enabled: boolean) => {
    updateConfig({ ...config, enabled });
    toast({
      title: enabled ? "Automação ativada!" : "Automação desativada!",
      description: enabled 
        ? "A cobrança automática foi ativada e começará a processar dívidas vencidas."
        : "A automação foi pausada. Nenhuma mensagem será enviada automaticamente."
    });
  };

  const handleManualProcess = async () => {
    try {
      await processAutomaticCollections();
      toast({
        title: "Processamento manual concluído!",
        description: "Verificação de cobranças executada com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro durante o processamento manual.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando automação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controle principal */}
      <Card className="border-l-4 border-l-blue-500 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                Automação de Cobrança
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Sistema inteligente de cobrança automática com escalonamento por dias de atraso
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge 
                variant={config.enabled ? "default" : "secondary"}
                className={`px-3 py-1 text-sm ${
                  config.enabled 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                {config.enabled ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    ATIVO
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    PAUSADO
                  </>
                )}
              </Badge>
              
              {isProcessing && (
                <Badge variant="outline" className="animate-pulse">
                  <Clock className="w-3 h-3 mr-1" />
                  Processando...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <Label htmlFor="automation-toggle" className="text-base font-semibold text-gray-900">
                  Automação Ativa
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Ativar/pausar o sistema de cobrança automática
                </p>
              </div>
            </div>
            
            <Switch
              id="automation-toggle"
              checked={config.enabled}
              onCheckedChange={handleToggleAutomation}
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleManualProcess}
              disabled={isProcessing}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isProcessing ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Processar Agora
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dívidas Vencidas</p>
                <p className="text-3xl font-bold text-red-600">{overdueDebts.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  R$ {overdueDebts.reduce((sum, debt) => sum + debt.valor, 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mensagens Enviadas</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalSent}</p>
                <p className="text-xs text-gray-500 mt-1">Hoje: {communications.filter(c => 
                  c.sentAt.startsWith(new Date().toISOString().split('T')[0])
                ).length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Resposta</p>
                <p className="text-3xl font-bold text-purple-600">{stats.responseRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalResponded}/{stats.totalSent} responderam
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversas Pendentes</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingConversations}</p>
                <p className="text-xs text-gray-500 mt-1">Aguardando resposta</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações de escalonamento */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Escalonamento de Cobrança
          </CardTitle>
          <CardDescription>
            Como as mensagens são escalonadas conforme os dias de atraso
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800">Lembrete Amigável</h4>
              <p className="text-sm text-green-600 mt-1">
                {Math.abs(config.escalation.beforeDue)} dias antes do vencimento
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800">Urgência Moderada</h4>
              <p className="text-sm text-yellow-600 mt-1">
                No dia do vencimento
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800">Tom Sério</h4>
              <p className="text-sm text-orange-600 mt-1">
                {config.escalation.afterDue1} dia após vencimento
              </p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800">Cobrança Formal</h4>
              <p className="text-sm text-red-600 mt-1">
                {config.escalation.afterDue7} dias após vencimento
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800">Último Aviso</h4>
              <p className="text-sm text-purple-600 mt-1">
                {config.escalation.afterDue15} dias após vencimento
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800">Ameaça Protesto</h4>
              <p className="text-sm text-gray-600 mt-1">
                {config.escalation.afterDue30}+ dias após vencimento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de dívidas vencidas para processar */}
      {overdueDebts.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Dívidas Vencidas para Processar
            </CardTitle>
            <CardDescription>
              {overdueDebts.length} dívida(s) vencida(s) identificada(s) para cobrança automática
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {overdueDebts.slice(0, 10).map((debt) => {
                const daysOverdue = Math.floor(
                  (new Date().getTime() - new Date(debt.data_vencimento || '').getTime()) 
                  / (1000 * 60 * 60 * 24)
                );
                
                return (
                  <div key={debt.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{debt.nome}</p>
                      <p className="text-sm text-gray-600">
                        Valor: R$ {debt.valor.toFixed(2)} • Venceu há {daysOverdue} dias
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {daysOverdue} dias
                    </Badge>
                  </div>
                );
              })}
              
              {overdueDebts.length > 10 && (
                <p className="text-center text-sm text-gray-500 py-2">
                  E mais {overdueDebts.length - 10} dívida(s) vencida(s)...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutomationDashboard;
