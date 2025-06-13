
import { useState } from 'react';
import { useLocalDataManager } from '@/hooks/useLocalDataManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Calendar } from 'lucide-react';

const Debts = () => {
  const { database, addDebt, addCollectionMessage, isLoaded } = useLocalDataManager();
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<{ clientId: string; debtId: string } | null>(null);
  
  const [debtForm, setDebtForm] = useState({
    clientId: '',
    descricao: '',
    valor: '',
    dataVencimento: '',
    status: 'pendente' as const
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!debtForm.clientId || !debtForm.descricao || !debtForm.valor) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDebt({
        clientId: debtForm.clientId,
        valor: parseFloat(debtForm.valor),
        dataVencimento: debtForm.dataVencimento,
        status: debtForm.status,
        descricao: debtForm.descricao
      });

      setDebtForm({
        clientId: '',
        descricao: '',
        valor: '',
        dataVencimento: '',
        status: 'pendente'
      });
      setIsDebtDialogOpen(false);
      
      toast({
        title: "Dívida adicionada!",
        description: "Dívida cadastrada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar dívida:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar dívida",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'text-green-600 bg-green-100';
      case 'atrasado': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pago': return 'Paga';
      case 'atrasado': return 'Vencida';
      default: return 'Pendente';
    }
  };

  const getClientName = (clientId: string) => {
    const client = database.clients.find(c => c.id === clientId);
    return client ? client.nome : 'Cliente não encontrado';
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dívidas</h1>
        <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Dívida
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Dívida</DialogTitle>
              <DialogDescription>
                Preencha os dados da dívida
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDebtSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente *</Label>
                <Select value={debtForm.clientId} onValueChange={(value) => setDebtForm({ ...debtForm, clientId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {database.clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={debtForm.descricao}
                  onChange={(e) => setDebtForm({ ...debtForm, descricao: e.target.value })}
                  placeholder="Descrição da dívida"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={debtForm.valor}
                  onChange={(e) => setDebtForm({ ...debtForm, valor: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={debtForm.dataVencimento}
                  onChange={(e) => setDebtForm({ ...debtForm, dataVencimento: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDebtDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {database.debts.map((debt) => (
          <Card key={debt.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{debt.descricao}</CardTitle>
                  <CardDescription>{getClientName(debt.clientId)}</CardDescription>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                  {getStatusText(debt.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-medium">{formatCurrency(debt.valor)}</span>
                </div>
                {debt.dataVencimento && (
                  <div className="flex justify-between">
                    <span>Vencimento:</span>
                    <span className="font-medium">{new Date(debt.dataVencimento).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Criado em:</span>
                  <span className="font-medium">{new Date(debt.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {database.debts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Nenhuma dívida cadastrada ainda.</p>
            <p className="text-sm text-gray-500 mt-2">
              Clique em "Nova Dívida" para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Debts;
