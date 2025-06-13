
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import WhatsAppQRCode from '@/components/WhatsAppQRCode';
import WhatsAppLogs from '@/components/WhatsAppLogs';
import WhatsAppConfig from '@/components/WhatsAppConfig';
import AutomationConfig from '@/components/AutomationConfig';
import CommunicationMonitor from '@/components/CommunicationMonitor';
import CobrancaDashboard from '@/components/CobrancaDashboard';
import AlertasConfig from '@/components/AlertasConfig';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCobrancaMetrics } from '@/hooks/useCobrancaMetrics';
import { 
  MessageSquare, 
  Users, 
  FileText, 
  Settings,
  Smartphone,
  Activity,
  TrendingUp,
  BarChart3,
  Bell
} from 'lucide-react';
import MessageTemplates from '@/components/MessageTemplates';

const WhatsApp = () => {
  const { connection, logs } = useWhatsAppConnection();
  const { getDashboardMetrics } = useLocalStorage();
  const { metrics } = useCobrancaMetrics();
  const basicMetrics = getDashboardMetrics();

  const getStatsCards = () => [
    {
      title: 'Status da Conexão',
      value: connection.isConnected ? 'Online' : 'Offline',
      icon: Smartphone,
      color: connection.isConnected ? 'text-green-600' : 'text-red-600',
      bg: connection.isConnected ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Mensagens Hoje',
      value: metrics?.mensagensHoje?.toString() || '0',
      icon: MessageSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Taxa de Resposta',
      value: metrics ? `${metrics.taxaResposta.toFixed(1)}%` : '0%',
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Clientes Ativos',
      value: basicMetrics.totalClients.toString(),
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      title: 'Valor Recuperado',
      value: metrics ? `R$ ${metrics.valorTotalRecuperado.toFixed(2)}` : 'R$ 0,00',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Conversas Ativas',
      value: metrics?.conversasAtivas?.toString() || '0',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-green-600" />
            Sistema de Cobrança WhatsApp
          </h1>
          <p className="text-gray-600 mt-2">
            Plataforma completa de automação de cobranças via WhatsApp
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={connection.isConnected ? "default" : "secondary"}
            className="flex items-center gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${
              connection.isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            {connection.isConnected ? 'WhatsApp Online' : 'WhatsApp Offline'}
          </Badge>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {getStatsCards().map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-full ${stat.bg}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informações Importantes */}
      {!connection.isConnected && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">WhatsApp não conectado</p>
                <p className="text-sm text-yellow-700">
                  Para usar o sistema de cobrança automática, você precisa conectar seu WhatsApp usando o QR Code.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Principais */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Conexão
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Logs ({logs.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Automação
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="alertas" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <CobrancaDashboard />
        </TabsContent>

        <TabsContent value="connection" className="space-y-6">
          <div className="flex justify-center">
            <WhatsAppQRCode />
          </div>
          
          {connection.isConnected && (
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conexão</CardTitle>
                <CardDescription>
                  Detalhes sobre a conexão ativa do WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Número Conectado:</p>
                    <p className="text-gray-600">{connection.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="font-medium">Última Atividade:</p>
                    <p className="text-gray-600">
                      {connection.lastSeen 
                        ? new Date(connection.lastSeen).toLocaleString('pt-BR')
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Status:</p>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Conectado e Ativo
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">Tentativas de Reconexão:</p>
                    <p className="text-gray-600">{connection.retryCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <WhatsAppLogs />
        </TabsContent>

        <TabsContent value="templates">
          <MessageTemplates />
        </TabsContent>

        <TabsContent value="automation">
          <AutomationConfig />
        </TabsContent>

        <TabsContent value="monitor">
          <CommunicationMonitor />
        </TabsContent>

        <TabsContent value="alertas">
          <AlertasConfig />
        </TabsContent>

        <TabsContent value="config">
          <WhatsAppConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsApp;
