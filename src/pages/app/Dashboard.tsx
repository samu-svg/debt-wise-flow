
import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { getDashboardMetrics, calculateInterest } = useLocalStorage();
  const metrics = getDashboardMetrics();

  useEffect(() => {
    // Calcular juros automaticamente ao carregar o dashboard
    calculateInterest();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Button onClick={calculateInterest} variant="outline">
          Atualizar Juros
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDebts}</div>
            <p className="text-xs text-muted-foreground">
              Dívidas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor pendente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos recebidos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dívidas em Atraso</CardTitle>
            <CardDescription>
              Situação das dívidas vencidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Quantidade:</span>
                <span className="text-sm text-red-600 font-bold">
                  {metrics.overdueCount} dívidas
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Valor Total:</span>
                <span className="text-sm text-red-600 font-bold">
                  {formatCurrency(metrics.totalOverdue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>
              Visão geral das finanças
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Taxa de Recuperação:</span>
                <span className="text-sm font-bold">
                  {metrics.totalAmount > 0 
                    ? `${((metrics.totalPaid / (metrics.totalAmount + metrics.totalPaid)) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Média por Cliente:</span>
                <span className="text-sm font-bold">
                  {metrics.totalClients > 0 
                    ? formatCurrency(metrics.totalAmount / metrics.totalClients)
                    : formatCurrency(0)
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
