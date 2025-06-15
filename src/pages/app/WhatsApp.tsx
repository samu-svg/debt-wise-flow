
import React, { Suspense, lazy, memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import EnhancedLoading from '@/components/ui/enhanced-loading';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { 
  MessageSquare, 
  Users, 
  Cloud,
  FileText,
  TrendingUp,
  AlertTriangle,
  Activity,
  Settings,
  Zap
} from 'lucide-react';

// Lazy loading otimizado
const WhatsAppOverview = lazy(() => 
  import('@/components/WhatsAppOverview').then(module => ({
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

const WhatsAppConfig = lazy(() => 
  import('@/components/WhatsAppConfig').then(module => ({
    default: module.default
  }))
);

// Componente memoizado para cards de estatísticas - Mobile Optimized
const StatsCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bg,
  trend,
  borderColor
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  trend?: 'up' | 'down' | 'stable';
  borderColor?: string;
}) => (
  <Card className={`shadow-sm hover:shadow-md transition-all duration-300 ${borderColor || 'border-gray-200'} hover:scale-105`}>
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate mb-1">{title}</p>
          <div className="flex items-center gap-2">
            <p className={`text-xl sm:text-2xl font-bold ${color} truncate`}>{value}</p>
            {trend && (
              <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                trend === 'up' ? 'bg-green-100 text-green-700' :
                trend === 'down' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'}
              </div>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${bg} flex-shrink-0 shadow-sm`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
));

StatsCard.displayName = 'StatsCard';

// Loading fallback otimizado
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center p-8 sm:p-12">
    <div className="text-center">
      <EnhancedLoading />
      <p className="text-gray-500 mt-4 text-sm">Carregando módulo...</p>
    </div>
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

const WhatsApp: React.FC = () => {
  const { connection, metrics, logStats, isConfigDirty } = useWhatsAppCloudAPI();

  // Memoizar cards de estatísticas com trends
  const statsCards = useMemo(() => [
    {
      title: 'Status da API',
      value: connection.isConnected ? 'Online' : 'Offline',
      icon: Cloud,
      color: connection.isConnected ? 'text-green-600' : 'text-red-600',
      bg: connection.isConnected ? 'bg-green-50' : 'bg-red-50',
      borderColor: connection.isConnected ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500',
      trend: connection.isConnected ? 'up' as const : 'down' as const
    },
    {
      title: 'Mensagens Hoje',
      value: metrics.messagestoday.toString(),
      icon: MessageSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      borderColor: 'border-l-4 border-l-blue-500',
      trend: metrics.messagestoday > 0 ? 'up' as const : 'stable' as const
    },
    {
      title: 'Conversas Ativas',
      value: metrics.activeConversations.toString(),
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      borderColor: 'border-l-4 border-l-indigo-500',
      trend: metrics.activeConversations > 0 ? 'up' as const : 'stable' as const
    },
    {
      title: 'Taxa de Erro',
      value: `${metrics.errorRate.toFixed(1)}%`,
      icon: metrics.errorRate > 10 ? AlertTriangle : TrendingUp,
      color: metrics.errorRate > 10 ? 'text-red-600' : 'text-green-600',
      bg: metrics.errorRate > 10 ? 'bg-red-50' : 'bg-green-50',
      borderColor: metrics.errorRate > 10 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500',
      trend: metrics.errorRate > 10 ? 'down' as const : 'up' as const
    }
  ], [connection.isConnected, metrics]);

  // Status badge otimizado
  const statusBadge = useMemo(() => (
    <div className="flex items-center gap-3">
      <Badge 
        variant={connection.isConnected ? "default" : "secondary"}
        className={`flex items-center gap-2 text-sm px-4 py-2 ${
          connection.isConnected ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${
          connection.isConnected ? 'bg-green-600 animate-pulse' : 'bg-gray-400'
        }`} />
        <span>
          {connection.isConnected ? 'API Online' : 'API Offline'}
        </span>
        {isConfigDirty && (
          <span className="text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded-full">
            *
          </span>
        )}
      </Badge>
      
      <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
        <Zap className="w-3 h-3" />
        <span>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</span>
      </div>
    </div>
  ), [connection.isConnected, isConfigDirty]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3 text-gray-900 mb-2">
                <div className="p-2 bg-green-100 rounded-xl">
                  <Cloud className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                </div>
                <span className="truncate">WhatsApp Cloud API</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                Gerenciamento completo da integração com WhatsApp Business - 
                Configurações, monitoramento e automação em um só lugar
              </p>
            </div>
            <div className="flex justify-end">
              {statusBadge}
            </div>
          </div>

          {/* Cards de Estatísticas - Mobile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {statsCards.map((stat, index) => (
              <StatsCard
                key={`${stat.title}-${index}`}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                bg={stat.bg}
                borderColor={stat.borderColor}
                trend={stat.trend}
              />
            ))}
          </div>

          {/* Tabs com lazy loading - Mobile Optimized */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <Tabs defaultValue="overview" className="space-y-6">
              <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-gray-100 h-auto rounded-xl p-1">
                  <TabsTrigger 
                    value="overview" 
                    className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                  >
                    <Activity className="w-4 h-4" />
                    <span className="hidden sm:inline">Visão Geral</span>
                    <span className="sm:hidden">Geral</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="templates" 
                    className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Templates</span>
                    <span className="sm:hidden">Msgs</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="config" 
                    className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Configurações</span>
                    <span className="sm:hidden">Config</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="logs" 
                    className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Logs</span>
                    <span className="sm:hidden">Log</span>
                    <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0.5">
                      {logStats.today}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4 sm:p-6">
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <TabsContent value="overview" className="space-y-6 mt-0">
                      <WhatsAppOverview />
                    </TabsContent>

                    <TabsContent value="templates" className="mt-0">
                      <MessageTemplates />
                    </TabsContent>

                    <TabsContent value="config" className="mt-0">
                      <WhatsAppConfig />
                    </TabsContent>

                    <TabsContent value="logs" className="mt-0">
                      <WhatsAppLogs />
                    </TabsContent>
                  </Suspense>
                </ErrorBoundary>
              </div>
            </Tabs>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default memo(WhatsApp);
