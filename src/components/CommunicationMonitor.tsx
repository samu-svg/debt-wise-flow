
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDataManager } from '@/hooks/useDataManager';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react';

const CommunicationMonitor = () => {
  const { messages, clients, loading } = useDataManager();

  const stats = useMemo(() => {
    const totalMessages = messages.length;
    const sentMessages = messages.filter(m => m.status_entrega === 'enviada').length;
    const errorMessages = messages.filter(m => m.status_entrega === 'erro').length;
    const pendingMessages = messages.filter(m => m.status_entrega === 'pendente').length;
    
    const todayMessages = messages.filter(m => {
      const messageDate = new Date(m.enviado_em || '');
      const today = new Date();
      return messageDate.toDateString() === today.toDateString();
    }).length;

    const uniqueClients = new Set(messages.map(m => m.cliente_id)).size;
    
    return {
      totalMessages,
      sentMessages,
      errorMessages,
      pendingMessages,
      todayMessages,
      uniqueClients,
      successRate: totalMessages > 0 ? (sentMessages / totalMessages) * 100 : 0
    };
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando comunicações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitor de Comunicação</h2>
          <p className="text-gray-600">Acompanhe o status das mensagens enviadas</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Mensagens Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.todayMessages}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clientes Contatados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold">{stats.uniqueClients}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              <span className="text-2xl font-bold">{stats.totalMessages}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Enviadas
            </CardTitle>
            <CardDescription>Mensagens entregues com sucesso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.sentMessages}</div>
            <Badge variant="outline" className="mt-2">
              {stats.totalMessages > 0 ? ((stats.sentMessages / stats.totalMessages) * 100).toFixed(1) : 0}% do total
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Pendentes
            </CardTitle>
            <CardDescription>Aguardando processamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingMessages}</div>
            <Badge variant="outline" className="mt-2">
              {stats.totalMessages > 0 ? ((stats.pendingMessages / stats.totalMessages) * 100).toFixed(1) : 0}% do total
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Com Erro
            </CardTitle>
            <CardDescription>Falhas na entrega</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.errorMessages}</div>
            <Badge variant="outline" className="mt-2">
              {stats.totalMessages > 0 ? ((stats.errorMessages / stats.totalMessages) * 100).toFixed(1) : 0}% do total
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagens Recentes</CardTitle>
          <CardDescription>
            Últimas {Math.min(5, messages.length)} mensagens enviadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma mensagem enviada ainda</p>
          ) : (
            <div className="space-y-3">
              {messages.slice(0, 5).map((message) => {
                const cliente = clients.find(c => c.id === message.cliente_id);
                return (
                  <div key={message.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {cliente?.nome || 'Cliente não encontrado'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(message.enviado_em || '').toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        message.status_entrega === 'enviada' ? 'default' :
                        message.status_entrega === 'erro' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {message.status_entrega === 'enviada' ? 'Enviada' :
                       message.status_entrega === 'erro' ? 'Erro' :
                       'Pendente'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationMonitor;
