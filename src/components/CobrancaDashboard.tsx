
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCobrancaMetrics } from '@/hooks/useCobrancaMetrics';
import { 
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const CobrancaDashboard = () => {
  const { metrics, exportarRelatorio } = useCobrancaMetrics();

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  const getMetricCards = () => [
    {
      title: 'Status Conexão',
      value: metrics.conexaoStatus === 'online' ? 'Online' : 'Offline',
      icon: Activity,
      color: metrics.conexaoStatus === 'online' ? 'text-green-600' : 'text-red-600',
      bg: metrics.conexaoStatus === 'online' ? 'bg-green-50' : 'bg-red-50',
      change: null
    },
    {
      title: 'Mensagens Hoje',
      value: metrics.mensagensHoje.toString(),
      icon: MessageSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      change: '+12%'
    },
    {
      title: 'Taxa de Resposta',
      value: `${metrics.taxaResposta.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      change: '+5.2%'
    },
    {
      title: 'Conversas Ativas',
      value: metrics.conversasAtivas.toString(),
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      change: null
    },
    {
      title: 'Valor Recuperado',
      value: `R$ ${metrics.valorTotalRecuperado.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      change: '+18.5%'
    },
    {
      title: 'Tempo Médio Resposta',
      value: `${metrics.tempoMedioResposta.toFixed(1)}h`,
      icon: Clock,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      change: '-2.1h'
    },
    {
      title: 'Comprovantes Pendentes',
      value: metrics.comprovantesRebidos.toString(),
      icon: CheckCircle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      change: null
    },
    {
      title: 'Conversão Negociação',
      value: `${metrics.conversaoNegociacaoParaPagamento.toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      change: '+3.8%'
    }
  ];

  // Safely get palavras-chave data with null checking
  const palavrasChaveData = metrics.palavrasChaveRespostas 
    ? Object.entries(metrics.palavrasChaveRespostas)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 8)
    : [];

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Cobrança</h2>
          <p className="text-gray-600 mt-1">Métricas em tempo real do sistema de cobrança</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => exportarRelatorio('excel', metrics)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Excel
          </Button>
          <Button 
            onClick={() => exportarRelatorio('pdf', metrics)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getMetricCards().map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                    {metric.change && (
                      <p className={`text-xs ${
                        metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change} vs ontem
                      </p>
                    )}
                  </div>
                  <div className={`p-2 rounded-full ${metric.bg}`}>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução de Envios Diários */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Envios (7 dias)</CardTitle>
            <CardDescription>Mensagens enviadas e respondidas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.relatorioEnviosDiario}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="enviadas" stroke="#3b82f6" name="Enviadas" />
                <Line type="monotone" dataKey="respondidas" stroke="#10b981" name="Respondidas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Efetividade por Template */}
        <Card>
          <CardHeader>
            <CardTitle>Efetividade por Template</CardTitle>
            <CardDescription>Taxa de resposta por tipo de mensagem</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(metrics.efetividadePorTemplate).map(([key, value]) => ({
                template: key.replace('_', ' '),
                taxa: value.taxa
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="template" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="taxa" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análises Avançadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Taxa de Recuperação por Valor */}
        <Card>
          <CardHeader>
            <CardTitle>Recuperação por Faixa</CardTitle>
            <CardDescription>Taxa de sucesso por valor da dívida</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.taxaRecuperacaoPorValor).map(([faixa, dados]) => (
              <div key={faixa} className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{faixa}</p>
                  <p className="text-sm text-gray-600">
                    R$ {dados.min} - R$ {dados.max}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg">
                  {dados.taxa}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ranking de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clientes Responsivos</CardTitle>
            <CardDescription>Clientes com melhor taxa de resposta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.rankingClientesResponsivos.slice(0, 5).map((cliente, index) => (
                <div key={cliente.clienteId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cliente.nome}</p>
                      <p className="text-xs text-gray-600">
                        R$ {cliente.valorRecuperado.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {cliente.taxaResposta.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Palavras-chave nas Respostas */}
        <Card>
          <CardHeader>
            <CardTitle>Palavras-chave</CardTitle>
            <CardDescription>Análise das respostas dos clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {palavrasChaveData.map(([palavra, count]) => (
                <div key={palavra} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{palavra}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
              {palavrasChaveData.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Nenhuma palavra-chave encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Efetividade Semanal</CardTitle>
          <CardDescription>Performance das últimas 4 semanas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.analiseEfetividadeSemanal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="taxa" fill="#3b82f6" name="Taxa %" />
              <Bar yAxisId="right" dataKey="valor" fill="#10b981" name="Valor R$" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default CobrancaDashboard;
