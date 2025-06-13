
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useCollectionAutomation } from '@/hooks/useCollectionAutomation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CommunicationLog } from '@/types/automation';
import {
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  MessageCircle
} from 'lucide-react';

const CommunicationMonitor = () => {
  const { communications, processClientResponse } = useCollectionAutomation();
  const { clients } = useLocalStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComm, setSelectedComm] = useState<CommunicationLog | null>(null);

  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviado': return 'bg-blue-100 text-blue-800';
      case 'lido': return 'bg-yellow-100 text-yellow-800';
      case 'respondido': return 'bg-green-100 text-green-800';
      case 'erro': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConversationStateColor = (state: string) => {
    switch (state) {
      case 'AGUARDANDO': return 'bg-orange-100 text-orange-800';
      case 'NEGOCIANDO': return 'bg-blue-100 text-blue-800';
      case 'COMPROVANTE': return 'bg-purple-100 text-purple-800';
      case 'FINALIZADO': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageTypeLabel = (type: string) => {
    const types = {
      lembrete_amigavel: 'Lembrete Amigável',
      urgencia_moderada: 'Urgência Moderada',
      tom_serio: 'Tom Sério',
      cobranca_formal: 'Cobrança Formal',
      ultimo_aviso: 'Último Aviso',
      ameaca_protesto: 'Ameaça Protesto'
    };
    return types[type as keyof typeof types] || type;
  };

  const filteredCommunications = communications.filter(comm => {
    const client = getClient(comm.clientId);
    const matchesSearch = client?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         client?.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || comm.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSimulateResponse = (commId: string, response: string) => {
    const comm = communications.find(c => c.id === commId);
    if (comm) {
      processClientResponse(comm.clientId, response);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de Comunicações */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Monitor de Comunicações
            </CardTitle>
            <CardDescription>
              Acompanhe todas as mensagens enviadas e respostas recebidas
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Filtros */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">Todos Status</option>
                <option value="enviado">Enviado</option>
                <option value="lido">Lido</option>
                <option value="respondido">Respondido</option>
                <option value="erro">Erro</option>
              </select>
            </div>

            {/* Lista */}
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredCommunications.map((comm) => {
                  const client = getClient(comm.clientId);
                  return (
                    <div
                      key={comm.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedComm?.id === comm.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedComm(comm)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{client?.name || 'Cliente não encontrado'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(comm.status)}>
                            {comm.status}
                          </Badge>
                          <Badge className={getConversationStateColor(comm.conversationState)}>
                            {comm.conversationState}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{getMessageTypeLabel(comm.messageType)}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(comm.sentAt).toLocaleString('pt-BR')}
                        </div>
                      </div>

                      {comm.clientResponse && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                          <strong>Resposta:</strong> {comm.clientResponse}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes da Comunicação */}
      <div className="space-y-4">
        {selectedComm ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalhes da Comunicação
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label className="font-medium">Cliente:</Label>
                <p>{getClient(selectedComm.clientId)?.name}</p>
              </div>

              <div>
                <Label className="font-medium">Tipo de Mensagem:</Label>
                <p>{getMessageTypeLabel(selectedComm.messageType)}</p>
              </div>

              <div>
                <Label className="font-medium">Status:</Label>
                <Badge className={getStatusColor(selectedComm.status)}>
                  {selectedComm.status}
                </Badge>
              </div>

              <div>
                <Label className="font-medium">Estado da Conversa:</Label>
                <Badge className={getConversationStateColor(selectedComm.conversationState)}>
                  {selectedComm.conversationState}
                </Badge>
              </div>

              <div>
                <Label className="font-medium">Enviado em:</Label>
                <p>{new Date(selectedComm.sentAt).toLocaleString('pt-BR')}</p>
              </div>

              {selectedComm.responseAt && (
                <div>
                  <Label className="font-medium">Respondido em:</Label>
                  <p>{new Date(selectedComm.responseAt).toLocaleString('pt-BR')}</p>
                </div>
              )}

              {selectedComm.clientResponse && (
                <div>
                  <Label className="font-medium">Resposta do Cliente:</Label>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {selectedComm.clientResponse}
                  </div>
                </div>
              )}

              <div>
                <Label className="font-medium">Tentativas:</Label>
                <p>{selectedComm.retryCount}</p>
              </div>

              {/* Simulador de Resposta */}
              {selectedComm.conversationState === 'AGUARDANDO' && (
                <div className="space-y-2 pt-4 border-t">
                  <Label className="font-medium">Simular Resposta:</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSimulateResponse(selectedComm.id, 'PAGUEI')}
                      className="flex-1"
                    >
                      PAGUEI
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSimulateResponse(selectedComm.id, 'NEGOCIAR')}
                      className="flex-1"
                    >
                      NEGOCIAR
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">
                Selecione uma comunicação para ver os detalhes
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const Label = ({ className, children, ...props }: any) => (
  <label className={`text-sm font-medium ${className}`} {...props}>
    {children}
  </label>
);

export default CommunicationMonitor;
