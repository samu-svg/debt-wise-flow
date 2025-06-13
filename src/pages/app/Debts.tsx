
import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Calendar } from 'lucide-react';

const Debts = () => {
  const { clients, addDebt, addPayment } = useLocalStorage();
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<{ clientId: string; debtId: string } | null>(null);
  
  const [debtForm, setDebtForm] = useState({
    clientId: '',
    description: '',
    originalAmount: '',
    interestRate: '',
    dueDate: '',
    status: 'active' as const
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const allDebts = clients.flatMap(client => 
    client.debts.map(debt => ({ ...debt, clientName: client.name }))
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!debtForm.clientId || !debtForm.description || !debtForm.originalAmount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    addDebt(debtForm.clientId, {
      description: debtForm.description,
      originalAmount: parseFloat(debtForm.originalAmount),
      interestRate: parseFloat(debtForm.interestRate) || 0,
      dueDate: debtForm.dueDate,
      status: debtForm.status
    });

    setDebtForm({
      clientId: '',
      description: '',
      originalAmount: '',
      interestRate: '',
      dueDate: '',
      status: 'active'
    });
    setIsDebtDialogOpen(false);
    
    toast({
      title: "Dívida adicionada!",
      description: "Dívida cadastrada com sucesso",
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDebt || !paymentForm.amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    addPayment(selectedDebt.clientId, selectedDebt.debtId, {
      amount: parseFloat(paymentForm.amount),
      date: paymentForm.date,
      description: paymentForm.description
    });

    setPaymentForm({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setSelectedDebt(null);
    setIsPaymentDialogOpen(false);
    
    toast({
      title: "Pagamento registrado!",
      description: "Pagamento adicionado com sucesso",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paga';
      case 'overdue': return 'Vencida';
      default: return 'Ativa';
    }
  };

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
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={debtForm.description}
                  onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })}
                  placeholder="Descrição da dívida"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalAmount">Valor Original *</Label>
                <Input
                  id="originalAmount"
                  type="number"
                  step="0.01"
                  value={debtForm.originalAmount}
                  onChange={(e) => setDebtForm({ ...debtForm, originalAmount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Taxa de Juros (% ao mês)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={debtForm.interestRate}
                  onChange={(e) => setDebtForm({ ...debtForm, interestRate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={debtForm.dueDate}
                  onChange={(e) => setDebtForm({ ...debtForm, dueDate: e.target.value })}
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
        {allDebts.map((debt) => (
          <Card key={debt.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{debt.description}</CardTitle>
                  <CardDescription>{debt.clientName}</CardDescription>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                  {getStatusText(debt.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Valor Original:</span>
                  <span className="font-medium">{formatCurrency(debt.originalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor Atual:</span>
                  <span className="font-medium text-red-600">{formatCurrency(debt.currentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Juros:</span>
                  <span className="font-medium">{debt.interestRate}% a.m.</span>
                </div>
                {debt.dueDate && (
                  <div className="flex justify-between">
                    <span>Vencimento:</span>
                    <span className="font-medium">{new Date(debt.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pagamentos:</span>
                  <span className="font-medium">{debt.payments.length}</span>
                </div>
              </div>
              
              {debt.status !== 'paid' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedDebt({ clientId: debt.clientId, debtId: debt.id });
                      setIsPaymentDialogOpen(true);
                    }}
                    className="w-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Registrar Pagamento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {allDebts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Nenhuma dívida cadastrada ainda.</p>
            <p className="text-sm text-gray-500 mt-2">
              Clique em "Nova Dívida" para começar.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Registre um pagamento para esta dívida
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Pagamento *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data do Pagamento *</Label>
              <Input
                id="date"
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDescription">Observações</Label>
              <Input
                id="paymentDescription"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                placeholder="Observações sobre o pagamento"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Debts;
