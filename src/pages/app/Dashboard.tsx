
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const { getStatistics, loading } = useSupabaseData();
  const statistics = getStatistics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08872B] mx-auto"></div>
          <p className="mt-2 text-[#6C757D]">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#343A40]">Dashboard</h1>
        <div className="text-sm text-[#6C757D]">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-[#DEE2E6]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#343A40]">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#343A40]">{statistics.totalClients}</div>
            <p className="text-xs text-[#6C757D]">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#DEE2E6]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#343A40]">Total de Dívidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#343A40]">{statistics.totalDebts}</div>
            <p className="text-xs text-[#6C757D]">
              {statistics.pendingDebts} pendentes, {statistics.overdueDebts} atrasadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#DEE2E6]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#343A40]">Valor Total em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#DC3545]">
              {formatCurrency(statistics.totalAmount)}
            </div>
            <p className="text-xs text-[#6C757D]">
              Valor pendente
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#DEE2E6]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#343A40]">Mensagens Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#08872B]">
              {statistics.messagesSent}
            </div>
            <p className="text-xs text-[#6C757D]">
              de {statistics.messagesTotal} total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-[#DEE2E6]">
          <CardHeader>
            <CardTitle className="text-[#343A40]">Dívidas em Atraso</CardTitle>
            <CardDescription className="text-[#6C757D]">
              Situação das dívidas vencidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#343A40]">Quantidade:</span>
                <span className="text-sm text-[#DC3545] font-bold">
                  {statistics.overdueDebts} dívidas
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#343A40]">Valor Total:</span>
                <span className="text-sm text-[#DC3545] font-bold">
                  {formatCurrency(statistics.overdueAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#DEE2E6]">
          <CardHeader>
            <CardTitle className="text-[#343A40]">Resumo Financeiro</CardTitle>
            <CardDescription className="text-[#6C757D]">
              Visão geral das finanças
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#343A40]">Dívidas Pagas:</span>
                <span className="text-sm font-bold text-[#08872B]">
                  {statistics.paidDebts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#343A40]">Taxa de Pagamento:</span>
                <span className="text-sm font-bold text-[#343A40]">
                  {statistics.totalDebts > 0 
                    ? `${((statistics.paidDebts / statistics.totalDebts) * 100).toFixed(1)}%`
                    : '0%'
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
