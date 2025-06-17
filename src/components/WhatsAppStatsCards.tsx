
import React, { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Cloud,
  MessageSquare,
  Users,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  trend?: 'up' | 'down' | 'stable';
  borderColor?: string;
}

const StatsCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bg,
  trend,
  borderColor
}: StatsCardProps) => (
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

interface WhatsAppStatsCardsProps {
  connection: { isConnected: boolean };
  messages: Array<{ status: string }>;
  allowlist: Array<{ isActive: boolean }>;
  credentials: { healthStatus?: string };
}

const WhatsAppStatsCards = memo(({ connection, messages, allowlist, credentials }: WhatsAppStatsCardsProps) => {
  const statsCards = useMemo(() => {
    const healthStatus = credentials.healthStatus || 'unknown';
    
    return [
      {
        title: 'Status da API',
        value: healthStatus === 'healthy' ? 'Saudável' : healthStatus === 'unhealthy' ? 'Com Problemas' : 'Desconhecido',
        icon: Cloud,
        color: healthStatus === 'healthy' ? 'text-green-600' : healthStatus === 'unhealthy' ? 'text-red-600' : 'text-gray-600',
        bg: healthStatus === 'healthy' ? 'bg-green-50' : healthStatus === 'unhealthy' ? 'bg-red-50' : 'bg-gray-50',
        borderColor: healthStatus === 'healthy' ? 'border-l-4 border-l-green-500' : healthStatus === 'unhealthy' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-gray-500',
        trend: healthStatus === 'healthy' ? 'up' as const : healthStatus === 'unhealthy' ? 'down' as const : 'stable' as const
      },
      {
        title: 'Mensagens Enviadas',
        value: messages.filter(m => m.status === 'sent').length.toString(),
        icon: MessageSquare,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        borderColor: 'border-l-4 border-l-blue-500',
        trend: messages.filter(m => m.status === 'sent').length > 0 ? 'up' as const : 'stable' as const
      },
      {
        title: 'Números Aprovados',
        value: `${allowlist.filter(n => n.isActive).length}/5`,
        icon: Users,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        borderColor: 'border-l-4 border-l-indigo-500',
        trend: allowlist.filter(n => n.isActive).length > 0 ? 'up' as const : 'stable' as const
      },
      {
        title: 'Taxa de Falha',
        value: `${messages.length > 0 ? ((messages.filter(m => m.status === 'failed').length / messages.length) * 100).toFixed(1) : 0}%`,
        icon: messages.filter(m => m.status === 'failed').length > 0 ? AlertTriangle : TrendingUp,
        color: messages.filter(m => m.status === 'failed').length > 0 ? 'text-red-600' : 'text-green-600',
        bg: messages.filter(m => m.status === 'failed').length > 0 ? 'bg-red-50' : 'bg-green-50',
        borderColor: messages.filter(m => m.status === 'failed').length > 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500',
        trend: messages.filter(m => m.status === 'failed').length > 0 ? 'down' as const : 'up' as const
      }
    ];
  }, [connection.isConnected, messages, allowlist, credentials]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {statsCards.map((card, index) => (
        <StatsCard key={index} {...card} />
      ))}
    </div>
  );
});

WhatsAppStatsCards.displayName = 'WhatsAppStatsCards';

export default WhatsAppStatsCards;
