
import React, { Suspense, lazy, memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import EnhancedLoading from '@/components/ui/enhanced-loading';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { 
  MessageSquare, 
  Users, 
  Cloud,
  FileText,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

// Lazy loading otimizado com preload
const WhatsAppCloudStatus = lazy(() => 
  import('@/components/WhatsAppCloudStatus').then(module => ({
    default: module.default
  }))
);

const WhatsAppCloudConfig = lazy(() => 
  import('@/components/WhatsAppCloudConfig').then(module => ({
    default: module.default
  }))
);

const WhatsAppLogs = lazy(() => 
  import('@/components/WhatsAppLogs').then(module => ({
    default: module.default
  }))
);

const MessageTemplates = lazy(() => 
  import('@/components/MessageTemplates').then(module => ({
    default: module.default
  }))
);

// Componente memoizado para cards de estatísticas
const StatsCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bg 
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}) => (
  <Card className="shadow-sm border-gray-200">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600">{title}</p>
          <p className={`text-lg font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-full ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
));

StatsCard.displayName = 'StatsCard';

// Componente principal com loading suspense otimizado
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center p-8">
    <EnhancedLoading />
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

const WhatsApp: React.FC = () => {
  const { connection, logs, metrics, logStats, isConfigDirty } = useWhatsAppCloudAPI();

  // Memoizar cards de estatísticas para evitar re-renders desnecessários
  const statsCards = useMemo(() => [
    {
      title: 'Status da API',
      value: connection.isConnected ? 'Online' : 'Offline',
      icon: Cloud,
      color: connection.isConnected ? 'text-green-600' : 'text-red-600',
      bg: connection.isConnected ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Mensagens Hoje',
      value: metrics.messagestoday.toString(),
      icon: MessageSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Conversas Ativas',
      value: metrics.activeConversations.toString(),
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      title: 'Taxa de Erro',
      value: `${metrics.errorRate.toFixed(1)}%`,
      icon: metrics.errorRate > 10 ? AlertTriangle : TrendingUp,
      color: metrics.errorRate > 10 ? 'text-red-600' : 'text-green-600',
      bg: metrics.errorRate > 10 ? 'bg-red-50' : 'bg-green-50'
    }
  ], [connection.isConnected, metrics]);

  // Memoizar status badge
  const statusBadge = useMemo(() => (
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
      {isConfigDirty && (
        <span className="text-xs bg-orange-200 text-orange-800 px-1 rounded">
          *
        </span>
      )}
    </Badge>
  ), [connection.isConnected, isConfigDirty]);

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
        {statusBadge}
      </div>

      {/* Cards de Estatísticas Otimizados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard
            key={`${stat.title}-${index}`}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
          />
        ))}
      </div>

      {/* Tabs com lazy loading otimizado */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 text-gray-600"
          >
            <Cloud className="w-4 h-4" />
            Visão Geral
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
            Logs ({logStats.today})
          </TabsTrigger>
        </TabsList>

        <Suspense fallback={<LoadingFallback />}>
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WhatsAppCloudStatus />
              <WhatsAppCloudConfig />
            </div>
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

export default memo(WhatsApp);
