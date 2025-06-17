
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWhatsAppMessages } from '@/hooks/useWhatsAppMessages';
import { useWhatsAppAllowlist } from '@/hooks/useWhatsAppAllowlist';
import { 
  MessageSquare, 
  Search, 
  Filter,
  CheckCircle, 
  Clock, 
  AlertCircle,
  XCircle,
  Send,
  Calendar,
  User,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WhatsAppMessagesManager = () => {
  const { messages, isLoading, getRecentMessages, getMessageStats } = useWhatsAppMessages();
  const { allowlist } = useWhatsAppAllowlist();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const stats = getMessageStats();

  // Filtrar mensagens
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const matchesSearch = searchTerm === '' || 
        message.phoneNumber.includes(searchTerm) ||
        message.messageText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.templateName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || message.status === statusFilter;

      const matchesDate = dateFilter === 'all' || (() => {
        const messageDate = new Date(message.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            return messageDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return messageDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return messageDate >= monthAgo;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [messages, searchTerm, statusFilter, dateFilter]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          variant: 'default' as const,
          label: status === 'sent' ? 'Enviada' : 'Entregue'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          variant: 'secondary' as const,
          label: 'Pendente'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          variant: 'destructive' as const,
          label: 'Falhou'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          variant: 'outline' as const,
          label: 'Desconhecido'
        };
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 13 && phone.startsWith('55')) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

  const getContactName = (phoneNumber: string) => {
    const contact = allowlist.find(item => item.phoneNumber === phoneNumber);
    return contact?.name || 'Contato não identificado';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciar Mensagens</h2>
            <p className="text-gray-600">Acompanhe e gerencie todas as mensagens enviadas</p>
          </div>
        </div>
        
        <Button 
          onClick={() => getRecentMessages()} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Enviadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Falharam</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Telefone, mensagem ou template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Mensagens ({filteredMessages.length})
          </CardTitle>
          <CardDescription>
            Lista de todas as mensagens enviadas através do WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {messages.length === 0 
                  ? 'Nenhuma mensagem enviada ainda' 
                  : 'Nenhuma mensagem encontrada com os filtros aplicados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((message) => {
                const statusConfig = getStatusConfig(message.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div 
                    key={message.id} 
                    className={`p-4 rounded-lg border ${statusConfig.border} ${statusConfig.bg} hover:shadow-sm transition-shadow`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {getContactName(message.phoneNumber)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatPhoneNumber(message.phoneNumber)}
                          </span>
                        </div>
                        
                        {message.templateName && (
                          <div className="flex items-center gap-2 mb-2">
                            <Send className="w-4 h-4 text-gray-400" />
                            <Badge variant="outline" className="text-xs">
                              Template: {message.templateName}
                            </Badge>
                          </div>
                        )}
                        
                        {message.messageText && (
                          <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                            {message.messageText}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {formatDistanceToNow(new Date(message.createdAt), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                          
                          {message.retryCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {message.retryCount} tentativas
                            </Badge>
                          )}
                          
                          {message.whatsappMessageId && (
                            <span className="font-mono text-xs text-gray-400">
                              ID: {message.whatsappMessageId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                        
                        {message.errorMessage && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <strong>Erro:</strong> {message.errorMessage}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={statusConfig.variant}
                          className={`flex items-center gap-1 ${statusConfig.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </Badge>
                        
                        {message.sentAt && (
                          <span className="text-xs text-gray-500">
                            Enviada: {new Date(message.sentAt).toLocaleString('pt-BR')}
                          </span>
                        )}
                        
                        {message.deliveredAt && (
                          <span className="text-xs text-gray-500">
                            Entregue: {new Date(message.deliveredAt).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
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

export default WhatsAppMessagesManager;
