import { useState } from 'react';
import { useLocalDataManager } from '@/hooks/useLocalDataManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

const Debts = () => {
  const { database, addDebt, loading } = useLocalDataManager();
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  
  const [debtForm, setDebtForm] = useState({
    clientId: '',
    descricao: '',
    valor: '',
    dataVencimento: '',
    status: 'pendente' as const
  });

  const clientes = database?.clients || [];
  const dividas = database?.debts || [];

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
      case 'pago': return 'text-[#08872B] bg-[#08872B]/10';
      case 'atrasado': return 'text-[#DC3545] bg-[#DC3545]/10';
      default: return 'text-[#6C757D] bg-[#6C757D]/10';
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
    const client = clientes.find(c => c.id === clientId);
    return client ? client.nome : 'Cliente não encontrado';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[#6C757D]">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#343A40]">Dívidas</h1>
        <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#08872B] hover:bg-[#059669] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Dívida
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-[#DEE2E6]">
            <DialogHeader>
              <DialogTitle className="text-[#343A40]">Cadastrar Nova Dívida</DialogTitle>
              <DialogDescription className="text-[#6C757D]">
                Preencha os dados da dívida
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDebtSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId" className="text-[#343A40] font-medium">Cliente *</Label>
                <Select value={debtForm.clientId} onValueChange={(value) => setDebtForm({ ...debtForm, clientId: value })}>
                  <SelectTrigger className="bg-white border-[#DEE2E6] text-[#343A40]">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#DEE2E6]">
                    {clientes.map((client) => (
                      <SelectItem key={client.id} value={client.id} className="text-[#343A40]">
                        {client.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-[#343A40] font-medium">Descrição *</Label>
                <Input
                  id="descricao"
                  value={debtForm.descricao}
                  onChange={(e) => setDebtForm({ ...debtForm, descricao: e.target.value })}
                  placeholder="Descrição da dívida"
                  className="bg-white border-[#DEE2E6] text-[#343A40] focus:border-[#08872B]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor" className="text-[#343A40] font-medium">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={debtForm.valor}
                  onChange={(e) => setDebtForm({ ...debtForm, valor: e.target.value })}
                  placeholder="0.00"
                  className="bg-white border-[#DEE2E6] text-[#343A40] focus:border-[#08872B]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataVencimento" className="text-[#343A40] font-medium">Data de Vencimento</Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={debtForm.dataVencimento}
                  onChange={(e) => setDebtForm({ ...debtForm, dataVencimento: e.target.value })}
                  className="bg-white border-[#DEE2E6] text-[#343A40] focus:border-[#08872B]"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDebtDialogOpen(false)} className="border-[#DEE2E6] text-[#6C757D] hover:bg-[#F8F9FA]">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#08872B] hover:bg-[#059669] text-white">Cadastrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {dividas.map((debt) => (
          <Card key={debt.id} className="bg-white border-[#DEE2E6]">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-[#343A40]">{debt.descricao}</CardTitle>
                  <CardDescription className="text-[#6C757D]">{getClientName(debt.clientId)}</CardDescription>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                  {getStatusText(debt.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#343A40]">Valor:</span>
                  <span className="font-medium text-[#343A40]">{formatCurrency(debt.valor)}</span>
                </div>
                {debt.dataVencimento && (
                  <div className="flex justify-between">
                    <span className="text-[#343A40]">Vencimento:</span>
                    <span className="font-medium text-[#343A40]">{new Date(debt.dataVencimento).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#343A40]">Criado em:</span>
                  <span className="font-medium text-[#343A40]">{new Date(debt.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dividas.length === 0 && (
        <Card className="bg-white border-[#DEE2E6]">
          <CardContent className="text-center py-12">
            <p className="text-[#6C757D]">Nenhuma dívida cadastrada ainda.</p>
            <p className="text-sm text-[#6C757D] mt-2">
              Clique em "Nova Dívida" para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Debts;
