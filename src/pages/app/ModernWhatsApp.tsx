
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import WhatsAppQRCode from '@/components/WhatsAppQRCode';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { 
  MessageSquare, 
  Users, 
  CheckCircle,
  AlertCircle,
  Clock,
  Send
} from 'lucide-react';

const ModernWhatsApp = () => {
  const { connection, disconnect } = useWhatsAppConnection();

  const stats = [
    {
      title: 'Status',
      value: connection.isConnected ? 'Conectado' : 'Desconectado',
      icon: connection.isConnected ? CheckCircle : AlertCircle,
      color: connection.isConnected ? 'green' : 'red'
    },
    {
      title: 'Mensagens Hoje',
      value: '12',
      icon: Send,
      color: 'blue'
    },
    {
      title: 'Conversas Ativas',
      value: '8',
      icon: Users,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automação WhatsApp</h1>
          <p className="text-gray-600 mt-2">Configure e monitore a automação de cobranças</p>
        </div>
        
        <StatusBadge status={connection.isConnected ? 'connected' : 'disconnected'}>
          {connection.isConnected ? 'Sistema Ativo' : 'Sistema Inativo'}
        </StatusBadge>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            red: 'bg-red-50 text-red-600',
            orange: 'bg-orange-50 text-orange-600'
          };
          
          return (
            <Card key={index} className="bg-white border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      {!connection.isConnected ? (
        /* Connection Card */
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <Card className="bg-white border border-gray-100">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 bg-green-50 rounded-full">
                    <MessageSquare className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold">Conectar WhatsApp</CardTitle>
                <CardDescription className="text-gray-600">
                  Conecte seu WhatsApp para ativar a automação de cobranças
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WhatsAppQRCode />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Connected Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection Info */}
          <Card className="bg-white border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Conexão Ativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Número Conectado</span>
                  <span className="font-medium">{connection.phoneNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <StatusBadge status="connected">Online</StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Última Atividade</span>
                  <span className="font-medium">
                    {connection.lastSeen 
                      ? new Date(connection.lastSeen).toLocaleTimeString('pt-BR')
                      : 'Agora'
                    }
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <Button 
                    onClick={disconnect} 
                    variant="outline" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Desconectar WhatsApp
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Enviar Cobrança Manual
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Agendar Mensagens
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Ver Conversas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card className="bg-white border border-gray-100 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Mensagens Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'João Silva', message: 'Cobrança enviada', time: '10:30', status: 'sent' },
                  { name: 'Maria Santos', message: 'Resposta recebida', time: '09:45', status: 'received' },
                  { name: 'Pedro Costa', message: 'Lembrete enviado', time: '08:20', status: 'sent' }
                ].map((msg, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {msg.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{msg.name}</p>
                        <p className="text-sm text-gray-600">{msg.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{msg.time}</p>
                      <StatusBadge status={msg.status === 'sent' ? 'active' : 'connected'}>
                        {msg.status === 'sent' ? 'Enviado' : 'Recebido'}
                      </StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModernWhatsApp;
