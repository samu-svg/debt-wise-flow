
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
  Activity
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

// Componente memoizado para cards de estatísticas - Mobile Optimized
const StatsCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bg,
  trend
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  trend?: 'up' | 'down' | 'stable';
}) => (
  <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-600 truncate">{title}</p>
          <div className="flex items-center gap-2">
            <p className={`text-lg sm:text-xl font-bold ${color} truncate`}>{value}</p>
            {trend && (
              <div className={`text-xs px-1.5 py-0.5 rounded ${
                trend === 'up' ? 'bg-green-100 text-green-700' :
                trend === 'down' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
              </div>
            )}
          </div>
        </div>
        <div className={`p-2 rounded-full ${bg} flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
));

StatsCard.displayName = 'StatsCard';

// Loading fallback otimizado
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center p-4 sm:p-8">
    <EnhancedLoading />
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
      trend: connection.isConnected ? 'up' as const : 'down' as const
    },
    {
      title: 'Mensagens Hoje',
      value: metrics.messagestoday.toString(),
      icon: MessageSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: metrics.messagestoday > 0 ? 'up' as const : 'stable' as const
    },
    {
      title: 'Conversas Ativas',
      value: metrics.activeConversations.toString(),
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      trend: metrics.activeConversations > 0 ? 'up' as const : 'stable' as const
    },
    {
      title: 'Taxa de Erro',
      value: `${metrics.errorRate.toFixed(1)}%`,
      icon: metrics.errorRate > 10 ? AlertTriangle : TrendingUp,
      color: metrics.errorRate > 10 ? 'text-red-600' : 'text-green-600',
      bg: metrics.errorRate > 10 ? 'bg-red-50' : 'bg-green-50',
      trend: metrics.errorRate > 10 ? 'down' as const : 'up' as const
    }
  ], [connection.isConnected, metrics]);

  // Status badge otimizado
  const statusBadge = useMemo(() => (
    <Badge 
      variant={connection.isConnected ? "default" : "secondary"}
      className={`flex items-center gap-2 text-xs sm:text-sm ${
        connection.isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${
        connection.isConnected ? 'bg-green-600' : 'bg-gray-400'
      }`} />
      <span className="hidden sm:inline">
        {connection.isConnected ? 'API Online' : 'API Offline'}
      </span>
      <span className="sm:hidden">
        {connection.isConnected ? 'Online' : 'Offline'}
      </span>
      {isConfigDirty && (
        <span className="text-xs bg-orange-200 text-orange-800 px-1 rounded">
          *
        </span>
      )}
    </Badge>
  ), [connection.isConnected, isConfigDirty]);

  return (
    <ErrorBoundary>
      <div className="space-y-4 sm:space-y-6 bg-white min-h-screen p-4 sm:p-6">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3 text-gray-800">
              <Cloud className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <span className="truncate">WhatsApp Cloud API</span>
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              Gerenciamento da integração com WhatsApp Business
            </p>
          </div>
          <div className="flex justify-end">
            {statusBadge}
          </div>
        </div>

        {/* Cards de Estatísticas - Mobile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsCards.map((stat, index) => (
            <StatsCard
              key={`${stat.title}-${index}`}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              bg={stat.bg}
              trend={stat.trend}
            />
          ))}
        </div>

        {/* Tabs com lazy loading - Mobile Optimized */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 h-auto">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-1 sm:gap-2 text-gray-600 p-2 sm:p-3 text-xs sm:text-sm"
            >
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="flex items-center gap-1 sm:gap-2 text-gray-600 p-2 sm:p-3 text-xs sm:text-sm"
            >
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">Templates</span>
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="flex items-center gap-1 sm:gap-2 text-gray-600 p-2 sm:p-3 text-xs sm:text-sm"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">Logs ({logStats.today})</span>
            </TabsTrigger>
          </TabsList>

          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <WhatsAppOverview />
              </TabsContent>

              <TabsContent value="templates">
                <MessageTemplates />
              </TabsContent>

              <TabsContent value="logs">
                <WhatsAppLogs />
              </TabsContent>
            </Suspense>
          </ErrorBoundary>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default memo(WhatsApp);
