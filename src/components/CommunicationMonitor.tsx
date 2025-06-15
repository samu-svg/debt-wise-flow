
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollectionAutomation } from '@/hooks/useCollectionAutomation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useFilters } from '@/hooks/useFilters';
import { CommunicationLog } from '@/types/automation';
import {
  MessageSquare,
  User,
  Clock,
  Eye,
  MessageCircle
} from 'lucide-react';
import FiltersBar from './FiltersBar';

const CommunicationMonitor = () => {
  const { communications, processClientResponse } = useCollectionAutomation();
  const { clients } = useLocalStorage();
  const [selectedComm, setSelectedComm] = useState<CommunicationLog | null>(null);

  // Sistema de filtros
  const {
    searchValue,
    setSearchValue,
    filters,
    updateFilter,
    resetFilters,
    filteredData: filteredCommunications,
    hasActiveFilters,
    resultCount
  } = useFilters({
    data: communications,
    searchFields: ['messageType', 'clientResponse'],
    filterFunctions: {
      status: (comm, filterValue) => {
        return filterValue === 'all' || comm.status === filterValue;
      },
      conversationState: (comm, filterValue) => {
        return filterValue === 'all' || comm.conversationState === filterValue;
      },
      messageType: (comm, filterValue) => {
        return filterValue === 'all' || comm.messageType === filterValue;
      },
      hasResponse: (comm, filterValue) => {
        if (filterValue === 'with-response') return !!comm.clientResponse;
        if (filterValue === 'without-response') return !comm.clientResponse;
        return true;
      },
      cliente: (comm, filterValue) => {
        return filterValue === 'all' || comm.clientId === filterValue;
      }
    }
  });

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

  const handleSimulateResponse = (commId: string, response: string) => {
    const comm = communications.find(c => c.id === commId);
    if (comm) {
      processClientResponse(comm.clientId, response);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div>
        <h2 className="text-2xl font-bold text-[#343A40] mb-2">Monitor de Comunicações</h2>
        <p className="text-[#6C757D]">
          {hasActiveFilters 
            ? `${resultCount} de ${communications.length} comunicações encontradas`
            : `${communications.length} comunicações registradas`
          }
        </p>
      </div>

      {/* Sistema de Filtros */}
      <FiltersBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Buscar por tipo de mensagem ou resposta..."
        filters={[
          {
            value: filters.status || 'all',
            onChange: (value) => updateFilter('status', value),
            options: [
              { value: 'all', label: 'Todos os Status' },
              { value: 'enviado', label: 'Enviado' },
              { value: 'lido', label: 'Lido' },
              { value: 'respondido', label: 'Respondido' },
              { value: 'erro', label: 'Erro' }
            ],
            placeholder: 'Filtrar por status'
          },
          {
            value: filters.conversationState || 'all',
            onChange: (value) => updateFilter('conversationState', value),
            options: [
              { value: 'all', label: 'Todos os Estados' },
              { value: 'AGUARDANDO', label: 'Aguardando' },
              { value: 'NEGOCIANDO', label: 'Negociando' },
              { value: 'COMPROVANTE', label: 'Comprovante' },
              { value: 'FINALIZADO', label: 'Finalizado' }
            ],
            placeholder: 'Estado da conversa'
          },
          {
            value: filters.messageType || 'all',
            onChange: (value) => updateFilter('messageType', value),
            options: [
              { value: 'all', label: 'Todos os Tipos' },
              { value: 'lembrete_amigavel', label: 'Lembrete Amigável' },
              { value: 'urgencia_moderada', label: 'Urgência Moderada' },
              { value: 'tom_serio', label: 'Tom Sério' },
              { value: 'cobranca_formal', label: 'Cobrança Formal' },
              { value: 'ultimo_aviso', label: 'Último Aviso' },
              { value: 'ameaca_protesto', label: 'Ameaça Protesto' }
            ],
            placeholder: 'Tipo de mensagem'
          },
          {
            value: filters.hasResponse || 'all',
            onChange: (value) => updateFilter('hasResponse', value),
            options: [
              { value: 'all', label: 'Todas as Respostas' },
              { value: 'with-response', label: 'Com Resposta' },
              { value: 'without-response', label: 'Sem Resposta' }
            ],
            placeholder: 'Filtrar por resposta'
          },
          {
            value: filters.cliente || 'all',
            onChange: (value) => updateFilter('cliente', value),
            options: [
              { value: 'all', label: 'Todos os Clientes' },
              ...clients.map(client => ({
                value: client.id,
                label: client.name
              }))
            ],
            placeholder: 'Filtrar por cliente'
          }
        ]}
        onReset={resetFilters}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Comunicações */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comunicações
              </CardTitle>
              <CardDescription>
                Acompanhe todas as mensagens enviadas e respostas recebidas
              </CardDescription>
            </CardHeader>

            <CardContent>
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

                  {filteredCommunications.length === 0 && communications.length > 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Nenhuma comunicação encontrada com os filtros aplicados.</p>
                      <Button 
                        onClick={resetFilters}
                        variant="outline"
                        className="border-[#DEE2E6] text-[#6C757D] hover:bg-[#F8F9FA]"
                      >
                        Limpar filtros
                      </Button>
                    </div>
                  )}

                  {communications.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhuma comunicação registrada ainda.</p>
                    </div>
                  )}
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
    </div>
  );
};

const Label = ({ className, children, ...props }: any) => (
  <label className={`text-sm font-medium ${className}`} {...props}>
    {children}
  </label>
);

export default CommunicationMonitor;
