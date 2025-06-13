
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Play,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useCobrancaAutomatica } from '@/hooks/useCobrancaAutomatica';
import { toast } from '@/hooks/use-toast';

const CobrancaAutomatica = () => {
  const {
    clientes,
    mensagens,
    templates,
    loading,
    estatisticas,
    adicionarCliente,
    atualizarCliente,
    removerCliente,
    atualizarTemplate,
    executarCobrancaManual
  } = useCobrancaAutomatica();

  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    whatsapp: '',
    valor_divida: 0,
    data_vencimento: '',
    status: 'pendente'
  });

  const [templateEditando, setTemplateEditando] = useState<any>(null);

  const handleAdicionarCliente = async () => {
    try {
      await adicionarCliente(novoCliente);
      setNovoCliente({ nome: '', whatsapp: '', valor_divida: 0, data_vencimento: '', status: 'pendente' });
      toast({
        title: "Cliente adicionado!",
        description: "Cliente foi adicionado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar cliente.",
        variant: "destructive"
      });
    }
  };

  const handleExecutarCobranca = async () => {
    try {
      await executarCobrancaManual();
      toast({
        title: "Cobrança executada!",
        description: "Processo de cobrança foi executado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao executar cobrança.",
        variant: "destructive"
      });
    }
  };

  const handleSalvarTemplate = async () => {
    if (!templateEditando) return;
    
    try {
      await atualizarTemplate(templateEditando.id, {
        template: templateEditando.template
      });
      setTemplateEditando(null);
      toast({
        title: "Template atualizado!",
        description: "Template foi salvo com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar template.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enviado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Enviado</Badge>;
      case 'erro':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const clientesEmAtraso = clientes.filter(c => {
    const hoje = new Date();
    const vencimento = new Date(c.data_vencimento);
    return vencimento < hoje && c.status === 'pendente';
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cobrança Automática</h1>
          <p className="text-gray-600">Gerencie cobranças automáticas via WhatsApp</p>
        </div>
        <Button onClick={handleExecutarCobranca} disabled={loading}>
          <Play className="w-4 h-4 mr-2" />
          Executar Cobrança
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold">{estatisticas.totalClientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Atraso</p>
                <p className="text-2xl font-bold">{estatisticas.clientesEmAtraso}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">R$ {estatisticas.valorTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mensagens Enviadas</p>
                <p className="text-2xl font-bold">{estatisticas.mensagensEnviadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="mensagens">Histórico</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Tab Clientes */}
        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gerenciar Clientes</CardTitle>
                  <CardDescription>
                    Adicione e gerencie clientes para cobrança automática
                  </CardDescription>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                          id="nome"
                          value={novoCliente.nome}
                          onChange={(e) => setNovoCliente({...novoCliente, nome: e.target.value})}
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          value={novoCliente.whatsapp}
                          onChange={(e) => setNovoCliente({...novoCliente, whatsapp: e.target.value})}
                          placeholder="5511999999999"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor da Dívida</Label>
                        <Input
                          id="valor"
                          type="number"
                          step="0.01"
                          value={novoCliente.valor_divida}
                          onChange={(e) => setNovoCliente({...novoCliente, valor_divida: parseFloat(e.target.value) || 0})}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vencimento">Data de Vencimento</Label>
                        <Input
                          id="vencimento"
                          type="date"
                          value={novoCliente.data_vencimento}
                          onChange={(e) => setNovoCliente({...novoCliente, data_vencimento: e.target.value})}
                        />
                      </div>
                      <Button onClick={handleAdicionarCliente} disabled={loading}>
                        Adicionar Cliente
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.whatsapp}</TableCell>
                      <TableCell>R$ {cliente.valor_divida.toFixed(2)}</TableCell>
                      <TableCell>{new Date(cliente.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant={cliente.status === 'pendente' ? 'destructive' : 'default'}>
                          {cliente.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => atualizarCliente(cliente.id, { status: 'pago' })}
                          >
                            Marcar Pago
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removerCliente(cliente.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Histórico */}
        <TabsContent value="mensagens">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Mensagens</CardTitle>
              <CardDescription>
                Acompanhe todas as mensagens enviadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mensagens.slice(0, 50).map((mensagem) => (
                    <TableRow key={mensagem.id}>
                      <TableCell>
                        {new Date(mensagem.enviado_em).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {(mensagem as any).clientes_cobranca?.nome || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {mensagem.tipo_mensagem.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(mensagem.status_entrega)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {mensagem.mensagem_enviada}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Templates */}
        <TabsContent value="templates">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">{template.nome}</CardTitle>
                      <CardDescription>
                        Tipo: {template.tipo.replace('_', ' ')}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setTemplateEditando(template)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{template.template}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para editar template */}
      <Dialog open={!!templateEditando} onOpenChange={() => setTemplateEditando(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Template: {templateEditando?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Variáveis disponíveis:</Label>
              <p className="text-sm text-gray-600">
                {`{{nome}}, {{valor}}, {{data}}, {{dias}}`} (apenas para templates de atraso)
              </p>
            </div>
            <Textarea
              value={templateEditando?.template || ''}
              onChange={(e) => setTemplateEditando({
                ...templateEditando,
                template: e.target.value
              })}
              rows={6}
              placeholder="Digite sua mensagem aqui..."
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setTemplateEditando(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarTemplate}>
                Salvar Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CobrancaAutomatica;
