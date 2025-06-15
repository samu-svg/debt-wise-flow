
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import WhatsAppCloudStatus from '@/components/WhatsAppCloudStatus';
import WhatsAppCloudConfig from '@/components/WhatsAppCloudConfig';
import WhatsAppLogs from '@/components/WhatsAppLogs';
import AutomationConfig from '@/components/AutomationConfig';
import CommunicationMonitor from '@/components/CommunicationMonitor';
import CobrancaDashboard from '@/components/CobrancaDashboard';
import AlertasConfig from '@/components/AlertasConfig';
import MessageTemplates from '@/components/MessageTemplates';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCobrancaMetrics } from '@/hooks/useCobrancaMetrics';
import { 
  MessageSquare, 
  Users, 
  FileText, 
  Settings,
  Cloud,
  Activity,
  TrendingUp,
  BarChart3,
  Bell,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

const WhatsApp = () => {
  const { connection, logs } = useWhatsAppCloudAPI();
  const { getDashboardMetrics } = useLocalStorage();
  const { metrics } = useCobrancaMetrics();
  const basicMetrics = getDashboardMetrics();

  const getStatsCards = () => [
    {
      title: 'Status da API',
      value: connection.isConnected ? 'Online' : 'Offline',
      icon: Cloud,
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

  const hasValidConfig = connection.isConnected || (connection.status === 'error');

  return (
    <div className="space-y-6 bg-white min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: '#374151 !important' }}>
            <Cloud className="w-8 h-8" style={{ color: '#10B981 !important' }} />
            Sistema WhatsApp Cloud API
          </h1>
          <p className="mt-2" style={{ color: '#6B7280 !important' }}>
            Plataforma completa de automação usando WhatsApp Business Cloud API
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={connection.isConnected ? "default" : "secondary"}
            className="flex items-center gap-2"
            style={{
              backgroundColor: connection.isConnected ? '#10B981 !important' : '#6B7280 !important',
              color: '#FFFFFF !important',
              borderColor: connection.isConnected ? '#10B981 !important' : '#6B7280 !important'
            }}
          >
            <div className={`w-2 h-2 rounded-full`} style={{
              backgroundColor: connection.isConnected ? '#FFFFFF !important' : '#F9FAFB !important'
            }} />
            {connection.isConnected ? 'API Online' : 'API Offline'}
          </Badge>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {getStatsCards().map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-sm" style={{ 
              backgroundColor: '#FFFFFF !important', 
              borderColor: '#E5E7EB !important' 
            }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#6B7280 !important' }}>
                      {stat.title}
                    </p>
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

      {/* Aviso de Configuração */}
      {!connection.isConnected && (
        <Card className="border-blue-200" style={{ 
          backgroundColor: '#F9FAFB !important',
          borderColor: '#E5E7EB !important' 
        }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {hasValidConfig ? (
                <AlertTriangle className="w-5 h-5" style={{ color: '#6B7280 !important' }} />
              ) : (
                <Settings className="w-5 h-5" style={{ color: '#6B7280 !important' }} />
              )}
              <div>
                <p className="font-medium" style={{ color: '#374151 !important' }}>
                  {hasValidConfig ? 'WhatsApp Cloud API com problemas' : 'Configure a WhatsApp Cloud API'}
                </p>
                <p className="text-sm" style={{ color: '#6B7280 !important' }}>
                  {hasValidConfig 
                    ? 'Verifique suas credenciais na aba de configuração e teste a conexão novamente.'
                    : 'Para usar o sistema de cobrança automática, configure suas credenciais da Meta Business na aba de configuração.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sucesso da Migração */}
      <Card className="border-green-200" style={{ 
        backgroundColor: '#F9FAFB !important',
        borderColor: '#10B981 !important' 
      }}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" style={{ color: '#10B981 !important' }} />
            <div>
              <p className="font-medium" style={{ color: '#374151 !important' }}>Sistema Atualizado!</p>
              <p className="text-sm" style={{ color: '#6B7280 !important' }}>
                Migração concluída! Agora usando WhatsApp Cloud API - mais estável, oficial e sem dependência do Node.js.
              </p>
            </div>
          </div>
        </CardContent>
      )}

      {/* Tabs Principais */}
      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8" style={{ 
          backgroundColor: '#FFFFFF !important', 
          borderColor: '#E5E7EB !important' 
        }}>
          <TabsTrigger 
            value="status" 
            className="flex items-center gap-2" 
            style={{ 
              color: '#6B7280 !important' 
            }}
            data-[state=active]:style={{ 
              backgroundColor: '#F9FAFB !important', 
              color: '#374151 !important' 
            }}
          >
            <Cloud className="w-4 h-4" />
            Status
          </TabsTrigger>
          <TabsTrigger 
            value="config" 
            className="flex items-center gap-2" 
            style={{ 
              color: '#6B7280 !important' 
            }}
            data-[state=active]:style={{ 
              backgroundColor: '#F9FAFB !important', 
              color: '#374151 !important' 
            }}
          >
            <Settings className="w-4 h-4" />
            Config
          </TabsTrigger>
          <TabsTrigger 
            value="dashboard" 
            className="flex items-center gap-2" 
            style={{ 
              color: '#6B7280 !important' 
            }}
            data-[state=active]:style={{ 
              backgroundColor: '#F9FAFB !important', 
              color: '#374151 !important' 
            }}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="logs" 
            className="flex items-center gap-2" 
            style={{ 
              color: '#6B7280 !important' 
            }}
            data-[state=active]:style={{ 
              backgroundColor: '#F9FAFB !important', 
              color: '#374151 !important' 
            }}
          >
            <FileText className="w-4 h-4" />
            Logs ({logs.length})
          </TabsTrigger>
          <TabsTrigger 
            value="templates" 
            className="flex items-center gap-2" 
            style={{ 
              color: '#6B7280 !important' 
            }}
            data-[state=active]:style={{ 
              backgroundColor: '#F9FAFB !important', 
              color: '#374151 !important' 
            }}
          >
            <MessageSquare className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger 
            value="automation" 
            className="flex items-center gap-2" 
            style={{ 
              color: '#6B7280 !important' 
            }}
            data-[state=active]:style={{ 
              backgroundColor: '#F9FAFB !important', 
              color: '#374151 !important' 
            }}
          >
            <Settings className="w-4 h-4" />
            Automação
          </TabsTrigger>
          <TabsTrigger 
            value="monitor" 
            className="flex items-center gap-2" 
            style={{ 
              color: '#6B7280 !important' 
            }}
            data-[state=active]:style={{ 
              backgroundColor: '#F9FAFB !important', 
              color: '#374151 !important' 
            }}
          >
            <Activity className="w-4 h-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger 
            value="alertas" 
            className="flex items-center gap-2" 
            style={{ 
              color: '#6B7280 !important' 
            }}
            data-[state=active]:style={{ 
              backgroundColor: '#F9FAFB !important', 
              color: '#374151 !important' 
            }}
          >
            <Bell className="w-4 h-4" />
            Alertas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          <div className="flex justify-center">
            <WhatsAppCloudStatus />
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <WhatsAppCloudConfig />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <CobrancaDashboard />
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
      </Tabs>
    </div>
  );
};

export default WhatsApp;
