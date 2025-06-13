
import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, Plus } from 'lucide-react';

const WhatsApp = () => {
  const { clients } = useLocalStorage();
  const [selectedClient, setSelectedClient] = useState('');
  const [message, setMessage] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const messageTemplates = [
    {
      id: 'reminder',
      name: 'Lembrete de Pagamento',
      template: 'Olá {NOME}, este é um lembrete sobre sua dívida de {VALOR} com vencimento em {DATA}. Entre em contato conosco para quitar ou negociar.'
    },
    {
      id: 'overdue',
      name: 'Cobrança Vencida',
      template: 'Olá {NOME},sua dívida de {VALOR} está vencida desde {DATA}. Entre em contato urgentemente para regularizar a situação.'
    },
    {
      id: 'payment_received',
      name: 'Pagamento Recebido',
      template: 'Olá {NOME}, confirmamos o recebimento do seu pagamento de {VALOR}. Obrigado!'
    },
    {
      id: 'negotiation',
      name: 'Proposta de Negociação',
      template: 'Olá {NOME}, temos uma proposta especial para quitação da sua dívida de {VALOR}. Entre em contato para mais detalhes.'
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const generateMessage = (templateId: string, client: any, debt: any) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (!template) return '';

    return template.template
      .replace('{NOME}', client.name)
      .replace('{VALOR}', formatCurrency(debt.currentAmount))
      .replace('{DATA}', debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('pt-BR') : 'N/A');
  };

  const sendWhatsAppMessage = (phone: string, message: string) => {
    // Remove caracteres não numéricos do telefone
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não tiver
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
    
    // Codifica a mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Gera o link do WhatsApp
    const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodedMessage}`;
    
    // Abre em nova aba
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp aberto!",
      description: "Mensagem preparada no WhatsApp",
    });
  };

  const sendToClient = () => {
    if (!selectedClient || !message) {
      toast({
        title: "Erro",
        description: "Selecione um cliente e digite uma mensagem",
        variant: "destructive",
      });
      return;
    }

    const client = clients.find(c => c.id === selectedClient);
    if (!client) return;

    sendWhatsAppMessage(client.phone, message);
  };

  const sendToAllOverdue = () => {
    const overdueDebts = clients.flatMap(client => 
      client.debts
        .filter(debt => debt.status === 'overdue')
        .map(debt => ({ client, debt }))
    );

    if (overdueDebts.length === 0) {
      toast({
        title: "Nenhuma dívida vencida",
        description: "Não há dívidas vencidas para enviar mensagens",
      });
      return;
    }

    overdueDebts.forEach(({ client, debt }) => {
      const message = generateMessage('overdue', client, debt);
      setTimeout(() => sendWhatsAppMessage(client.phone, message), 1000);
    });

    toast({
      title: "Mensagens enviadas!",
      description: `${overdueDebts.length} mensagens de cobrança enviadas`,
    });
  };

  const selectedClientData = clients.find(c => c.id === selectedClient);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Mensagens WhatsApp</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enviar Mensagem Individual</CardTitle>
            <CardDescription>
              Envie mensagens personalizadas para clientes específicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClientData && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm"><strong>Nome:</strong> {selectedClientData.name}</p>
                <p className="text-sm"><strong>Telefone:</strong> {selectedClientData.phone}</p>
                <p className="text-sm">
                  <strong>Dívidas ativas:</strong> {selectedClientData.debts.filter(d => d.status !== 'paid').length}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={4}
              />
            </div>

            <Button onClick={sendToClient} className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Enviar no WhatsApp
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensagens Automáticas</CardTitle>
            <CardDescription>
              Envie mensagens em massa para todos os clientes com dívidas vencidas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Cobrança Automática</h4>
              <p className="text-sm text-red-700 mb-3">
                Enviar mensagem de cobrança para todos os clientes com dívidas vencidas
              </p>
              <p className="text-xs text-red-600 mb-3">
                Clientes com dívidas vencidas: {
                  clients.reduce((count, client) => 
                    count + client.debts.filter(debt => debt.status === 'overdue').length, 0
                  )
                }
              </p>
              <Button onClick={sendToAllOverdue} variant="destructive" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Enviar Cobrança em Massa
              </Button>
            </div>

            <div className="space-y-3">
              <Label>Templates de Mensagem</Label>
              {messageTemplates.map((template) => (
                <div key={template.id} className="p-3 border border-gray-200 rounded-lg">
                  <h5 className="font-medium text-sm mb-1">{template.name}</h5>
                  <p className="text-xs text-gray-600 mb-2">{template.template}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (selectedClientData && selectedClientData.debts.length > 0) {
                        const debt = selectedClientData.debts[0];
                        const generatedMessage = generateMessage(template.id, selectedClientData, debt);
                        setMessage(generatedMessage);
                      } else {
                        setMessage(template.template);
                      }
                    }}
                  >
                    Usar Template
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
          <CardDescription>
            Instruções para usar o sistema de mensagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Mensagens Individuais:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Selecione um cliente da lista</li>
                <li>Digite ou use um template de mensagem</li>
                <li>Clique em "Enviar no WhatsApp"</li>
                <li>O WhatsApp será aberto com a mensagem pronta</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Cobrança em Massa:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Clique em "Enviar Cobrança em Massa"</li>
                <li>Uma aba do WhatsApp será aberta para cada cliente</li>
                <li>As mensagens são personalizadas automaticamente</li>
                <li>Envie cada mensagem manualmente no WhatsApp</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> As mensagens são abertas no WhatsApp Web ou aplicativo. 
              Certifique-se de ter o WhatsApp configurado no dispositivo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsApp;
