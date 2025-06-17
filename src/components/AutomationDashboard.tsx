
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useDataManager } from '@/hooks/useDataManager';
import { useLocalAutomation } from '@/hooks/useLocalAutomation';
import { 
  Bot, 
  Play, 
  Pause, 
  Activity, 
  MessageSquare, 
  Users, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const AutomationDashboard = () => {
  const { statistics, loading } = useDataManager();
  const { 
    config, 
    stats, 
    overdueDebts, 
    isProcessing, 
    updateConfig, 
    processAutomaticCollections 
  } = useLocalAutomation();

  const handleToggleAutomation = async (enabled: boolean) => {
    await updateConfig({ enabled });
  };

  const handleStartProcess = () => {
    processAutomaticCollections();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando automação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bot className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Automação Supabase</h2>
            <p className="text-gray-600">Sistema integrado de cobrança automática</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Automação</span>
            <Switch 
              checked={config.enabled} 
              onCheckedChange={handleToggleAutomation}
              disabled={isProcessing}
            />
          </div>
          <Badge variant={config.enabled ? "default" : "secondary"}>
            {config.enabled ? "Ativa" : "Inativa"}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Dívidas em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold">{overdueDebts.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Mensagens Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.totalSent}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.responseRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats.pendingConversations}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações de Automação</CardTitle>
          <CardDescription>
            Controle manual do sistema de cobrança automática
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">Processar Cobranças Pendentes</h3>
              <p className="text-sm text-gray-600">
                Enviar mensagens para {overdueDebts.length} dívidas em atraso
              </p>
            </div>
            <Button 
              onClick={handleStartProcess}
              disabled={isProcessing || overdueDebts.length === 0}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Processar Agora
                </>
              )}
            </Button>
          </div>

          {config.enabled && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">
                Automação ativa - Verificações automáticas em: {config.checkTimes.join(', ')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationDashboard;
