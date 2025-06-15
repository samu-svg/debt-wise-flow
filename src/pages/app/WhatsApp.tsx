
import { useState, Suspense, lazy } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { 
  MessageSquare, 
  Users, 
  Settings,
  Cloud,
  Activity,
  FileText,
  CheckCircle2
} from 'lucide-react';

// Lazy loading de componentes pesados
const WhatsAppCloudStatus = lazy(() => import('@/components/WhatsAppCloudStatus'));
const WhatsAppCloudConfig = lazy(() => import('@/components/WhatsAppCloudConfig'));
const WhatsAppLogs = lazy(() => import('@/components/WhatsAppLogs'));
const MessageTemplates = lazy(() => import('@/components/MessageTemplates'));

const WhatsApp: React.FC = () => {
  const { connection, logs } = useWhatsAppCloudAPI();

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
      value: '0',
      icon: MessageSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Conversas Ativas',
      value: '0',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-6 bg-white min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
            <Cloud className="w-8 h-8 text-green-600" />
            WhatsApp Cloud API
          </h1>
          <p className="mt-2 text-gray-600">
            Gerenciamento da integração com WhatsApp Business
          </p>
        </div>
        
        <Badge 
          variant={connection.isConnected ? "default" : "secondary"}
          className={`flex items-center gap-2 ${
            connection.isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            connection.isConnected ? 'bg-green-600' : 'bg-gray-400'
          }`} />
          {connection.isConnected ? 'API Online' : 'API Offline'}
        </Badge>
      </div>

      {/* Cards de Estatísticas Essenciais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {getStatsCards().map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">
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

      {/* Status de Migração */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Sistema Atualizado!</p>
              <p className="text-sm text-green-700">
                Agora usando WhatsApp Cloud API - mais estável e oficial.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Principais */}
      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
          <TabsTrigger 
            value="status" 
            className="flex items-center gap-2 text-gray-600"
          >
            <Cloud className="w-4 h-4" />
            Status
          </TabsTrigger>
          <TabsTrigger 
            value="config" 
            className="flex items-center gap-2 text-gray-600"
          >
            <Settings className="w-4 h-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger 
            value="templates" 
            className="flex items-center gap-2 text-gray-600"
          >
            <MessageSquare className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger 
            value="logs" 
            className="flex items-center gap-2 text-gray-600"
          >
            <FileText className="w-4 h-4" />
            Logs ({logs.length})
          </TabsTrigger>
        </TabsList>

        <Suspense fallback={<EnhancedLoading />}>
          <TabsContent value="status" className="space-y-6">
            <div className="flex justify-center">
              <WhatsAppCloudStatus />
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <WhatsAppCloudConfig />
          </TabsContent>

          <TabsContent value="templates">
            <MessageTemplates />
          </TabsContent>

          <TabsContent value="logs">
            <WhatsAppLogs />
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
};

export default WhatsApp;
