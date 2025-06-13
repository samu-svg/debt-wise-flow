import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import WhatsAppQRCode from '@/components/WhatsAppQRCode';
import WhatsAppLogs from '@/components/WhatsAppLogs';
import WhatsAppConfig from '@/components/WhatsAppConfig';
import AutomationConfig from '@/components/AutomationConfig';
import CommunicationMonitor from '@/components/CommunicationMonitor';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  MessageSquare, 
  Users, 
  FileText, 
  Settings,
  Smartphone,
  Activity,
  TrendingUp
} from 'lucide-react';
import MessageTemplates from '@/components/MessageTemplates';

const WhatsApp = () => {
  const { connection, logs } = useWhatsAppConnection();
  const { getDashboardMetrics } = useLocalStorage();
  const metrics = getDashboardMetrics();

  const getStatsCards = () => [
    {
      title: 'Status da Conexão',
      value: connection.isConnected ? 'Online' : 'Offline',
      icon: Smartphone,
      color: connection.isConnected ? 'text-green-600' : 'text-red-600',
      bg: connection.isConnected ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Logs Registrados',
      value: logs.length.toString(),
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Clientes Ativos',
      value: metrics.totalClients.toString(),
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Dívidas em Atraso',
      value: metrics.overdueCount.toString(),
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
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
            Conecte seu WhatsApp e automatize a cobrança de dívidas
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsCards().map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
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
      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
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
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Mensagens
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="config">
          <WhatsAppConfig />
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Automáticas</CardTitle>
              <CardDescription>
                Configure e gerencie mensagens de cobrança automática
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sistema de Mensagens em Desenvolvimento
                </h3>
                <p className="text-gray-600 mb-4">
                  A funcionalidade de mensagens automáticas será implementada na próxima etapa.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    <strong>Próximas funcionalidades:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Templates de mensagens personalizáveis</li>
                    <li>• Envio automático por vencimento</li>
                    <li>• Histórico de mensagens por cliente</li>
                    <li>• Agendamento de cobranças</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsApp;
