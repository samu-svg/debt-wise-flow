
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [clientesResult, dividasResult] = await Promise.all([
        supabase.from('clientes').select('id').eq('user_id', user.id),
        supabase.from('dividas').select('valor, status').eq('user_id', user.id)
      ]);

      const totalClientes = clientesResult.data?.length || 0;
      const dividas = dividasResult.data || [];
      const dividasPendentes = dividas.filter(d => d.status === 'pendente').length;
      const valorTotal = dividas.reduce((acc, d) => acc + Number(d.valor), 0);

      return {
        totalClientes,
        dividasPendentes,
        valorTotal,
        totalDividas: dividas.length
      };
    }
  });

  const StatCard = ({ title, value, description, icon: Icon, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Clientes"
          value={stats?.totalClientes || 0}
          description="Clientes cadastrados"
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="Dívidas Pendentes"
          value={stats?.dividasPendentes || 0}
          description="Aguardando pagamento"
          icon={AlertTriangle}
          color="text-red-600"
        />
        <StatCard
          title="Valor Total"
          value={`R$ ${(stats?.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description="Soma de todas as dívidas"
          icon={TrendingUp}
          color="text-green-600"
        />
        <StatCard
          title="Total de Dívidas"
          value={stats?.totalDividas || 0}
          description="Registradas no sistema"
          icon={CreditCard}
          color="text-purple-600"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Resumo do Sistema</CardTitle>
            <CardDescription>
              Visão geral das principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <Users className="h-6 w-6 text-blue-600" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Gestão de Clientes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cadastre e gerencie informações dos seus clientes
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <CreditCard className="h-6 w-6 text-green-600" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Controle de Dívidas
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Registre e acompanhe dívidas dos clientes
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Sistema de Cobrança
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Automatize o processo de cobrança
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a 
                href="/clientes" 
                className="block w-full p-3 text-left rounded-md border hover:bg-accent transition-colors"
              >
                <div className="font-medium">Novo Cliente</div>
                <div className="text-sm text-muted-foreground">Cadastrar novo cliente</div>
              </a>
              <a 
                href="/dividas" 
                className="block w-full p-3 text-left rounded-md border hover:bg-accent transition-colors"
              >
                <div className="font-medium">Nova Dívida</div>
                <div className="text-sm text-muted-foreground">Registrar nova dívida</div>
              </a>
              <a 
                href="/cobranca" 
                className="block w-full p-3 text-left rounded-md border hover:bg-accent transition-colors"
              >
                <div className="font-medium">Gerenciar Cobrança</div>
                <div className="text-sm text-muted-foreground">Configurar automação</div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
