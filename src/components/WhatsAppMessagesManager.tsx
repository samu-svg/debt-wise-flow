
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, Clock } from 'lucide-react';

interface Message {
  id: string;
  recipient: string;
  content: string;
  status: 'sent' | 'delivered' | 'failed';
  timestamp: Date;
}

const WhatsAppMessagesManager = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      recipient: '+5511999999999',
      content: 'Lembrete: Você tem uma pendência de R$ 150,00',
      status: 'delivered',
      timestamp: new Date()
    },
    {
      id: '2',
      recipient: '+5511888888888',
      content: 'Sua fatura vence amanhã. Evite juros!',
      status: 'sent',
      timestamp: new Date()
    }
  ]);

  const [newMessage, setNewMessage] = useState({ recipient: '', content: '' });

  const handleSendMessage = () => {
    if (newMessage.recipient && newMessage.content) {
      const message: Message = {
        id: Date.now().toString(),
        recipient: newMessage.recipient,
        content: newMessage.content,
        status: 'sent',
        timestamp: new Date()
      };
      setMessages([message, ...messages]);
      setNewMessage({ recipient: '', content: '' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'sent':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Nova Mensagem
          </CardTitle>
          <CardDescription>
            Envie mensagens individuais para clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Número do destinatário"
                value={newMessage.recipient}
                onChange={(e) => setNewMessage({ ...newMessage, recipient: e.target.value })}
              />
            </div>
            <Input
              placeholder="Conteúdo da mensagem"
              value={newMessage.content}
              onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
            />
            <Button onClick={handleSendMessage}>
              <Send className="w-4 h-4 mr-2" />
              Enviar Mensagem
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3 p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{message.recipient}</span>
                      <Badge variant={getStatusColor(message.status) as any}>
                        {message.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppMessagesManager;
