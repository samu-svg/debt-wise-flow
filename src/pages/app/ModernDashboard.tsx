
import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CircleDollarSign, 
  AlertTriangle, 
  TrendingUp,
  MessageSquare,
  Activity,
  Calendar
} from 'lucide-react';

const ModernDashboard = () => {
  const { getDashboardMetrics, calculateInterest } = useLocalStorage();
  const { connection } = useWhatsAppConnection();
  const metrics = getDashboardMetrics();

  useEffect(() => {
    calculateInterest();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const recentActivities = [
    {
      id: 1,
      action: 'Novo cliente cadastrado',
      time: '2 horas atrás',
      icon: Activity
    },
    {
      id: 2,
      action: 'Pagamento recebido - R$ 1.250,00',
      time: '4 horas atrás',
      icon: TrendingUp
    },
    {
      id: 3,
      action: 'WhatsApp desconectado',
      time: '1 dia atrás',
      icon: MessageSquare
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-600 mt-2">Acompanhe seu desempenho financeiro e automação</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total a Receber"
          value={formatCurrency(metrics.totalAmount)}
          icon={CircleDollarSign}
          color="blue"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Dívidas Atrasadas"
          value={formatCurrency(metrics.totalOverdue)}
          icon={AlertTriangle}
          color="red"
          trend={{ value: -8.2, isPositive: false }}
        />
        <StatCard
          title="Recebido no Mês"
          value={formatCurrency(metrics.totalPaid)}
          icon={TrendingUp}
          color="green"
          trend={{ value: 23.1, isPositive: true }}
        />
      </div>

      {/* WhatsApp Status */}
      <Card className="bg-white border border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">Automação WhatsApp</CardTitle>
            <CardDescription>Status da conexão e automação de cobranças</CardDescription>
          </div>
          <StatusBadge status={connection.isConnected ? 'connected' : 'disconnected'}>
            {connection.isConnected ? 'Conectado' : 'Desconectado'}
          </StatusBadge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${connection.isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                <MessageSquare className={`w-6 h-6 ${connection.isConnected ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {connection.isConnected ? 'Sistema ativo' : 'Sistema inativo'}
                </p>
                <p className="text-sm text-gray-600">
                  {connection.isConnected 
                    ? `Conectado: ${connection.phoneNumber}`
                    : 'Conecte seu WhatsApp para automação'
                  }
                </p>
              </div>
            </div>
            {!connection.isConnected && (
              <Button variant="outline" size="sm">
                Conectar WhatsApp
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Overview */}
        <Card className="bg-white border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total de Clientes</span>
                <span className="font-semibold">{metrics.totalClients}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Dívidas Ativas</span>
                <span className="font-semibold">{metrics.totalDebts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Em Atraso</span>
                <span className="font-semibold text-red-600">{metrics.overdueCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taxa de Recuperação</span>
                <span className="font-semibold text-green-600">
                  {metrics.totalAmount > 0 
                    ? `${((metrics.totalPaid / (metrics.totalAmount + metrics.totalPaid)) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="bg-white border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-full">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModernDashboard;
