import { useState } from 'react';
import { useDataManager } from '@/hooks/useDataManager';
import { useFilters } from '@/hooks/useFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, X, Calendar, DollarSign } from 'lucide-react';
import FiltersBar from '@/components/FiltersBar';

const Debts = () => {
  const { clients, debts, addDebt, loading } = useDataManager();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    valor: '',
    dataVencimento: '',
    status: 'pendente' as const,
    descricao: ''
  });

  // Sistema de filtros
  const {
    searchValue,
    setSearchValue,
    filters,
    updateFilter,
    resetFilters,
    filteredData: filteredDebts,
    hasActiveFilters,
    resultCount
  } = useFilters({
    data: debts,
    searchFields: ['descricao'],
    filterFunctions: {
      status: (debt, filterValue) => {
        if (filterValue === 'all') return true;
        return debt.status === filterValue;
      },
      valor: (debt, filterValue) => {
        const valor = debt.valor;
        if (filterValue === 'low') return valor <= 100;
        if (filterValue === 'medium') return valor > 100 && valor <= 1000;
        if (filterValue === 'high') return valor > 1000;
        return true;
      },
      vencimento: (debt, filterValue) => {
        if (!debt.data_vencimento) return filterValue === 'sem-data';
        
        const dueDate = new Date(debt.data_vencimento);
        const today = new Date();
        const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filterValue === 'vencido') return diffDays < 0;
        if (filterValue === 'hoje') return diffDays === 0;
        if (filterValue === 'proximo') return diffDays > 0 && diffDays <= 7;
        if (filterValue === 'futuro') return diffDays > 7;
        return true;
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.valor || !formData.descricao) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDebt({
        clientId: formData.clientId,
        valor: parseFloat(formData.valor),
        dataVencimento: formData.dataVencimento || undefined,
        status: formData.status,
        descricao: formData.descricao
      });
      
      setFormData({
        clientId: '',
        valor: '',
        dataVencimento: '',
        status: 'pendente',
        descricao: ''
      });
      setIsDialogOpen(false);
      
      toast({
        title: "Dívida adicionada!",
        description: "Dívida cadastrada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a dívida",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'pago':
        return <Badge variant="default" className="bg-green-500">Pago</Badge>;
      case 'atrasado':
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.nome || 'Cliente não encontrado';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08872B] mx-auto"></div>
          <p className="mt-2 text-[#6C757D]">Carregando dívidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#343A40]">Dívidas</h1>
          <p className="text-[#6C757D]">
            {hasActiveFilters 
              ? `${resultCount} de ${debts.length} dívidas encontradas`
              : `${debts.length} dívidas cadastradas`
            }
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                Preencha os dados da dívida para cadastro
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId" className="text-[#343A40] font-medium">Cliente *</Label>
                <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                  <SelectTrigger className="bg-white border-[#DEE2E6]">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-[#343A40] font-medium">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0,00"
                  className="bg-white border-[#DEE2E6] text-[#343A40] focus:border-[#08872B]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataVencimento" className="text-[#343A40] font-medium">Data de Vencimento</Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={formData.dataVencimento}
                  onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                  className="bg-white border-[#DEE2E6] text-[#343A40] focus:border-[#08872B]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-[#343A40] font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'pendente' | 'pago' | 'atrasado') => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-white border-[#DEE2E6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-[#DEE2E6] text-[#6C757D] hover:bg-[#F8F9FA]">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#08872B] hover:bg-[#059669] text-white">Cadastrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sistema de Filtros */}
      <FiltersBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Buscar por descrição..."
        filters={[
          {
            value: filters.status || 'all',
            onChange: (value) => updateFilter('status', value),
            options: [
              { value: 'all', label: 'Todos os Status' },
              { value: 'pendente', label: 'Pendente' },
              { value: 'pago', label: 'Pago' },
              { value: 'atrasado', label: 'Atrasado' }
            ],
            placeholder: 'Filtrar por status'
          },
          {
            value: filters.valor || 'all',
            onChange: (value) => updateFilter('valor', value),
            options: [
              { value: 'all', label: 'Todos os Valores' },
              { value: 'low', label: 'Até R$ 100' },
              { value: 'medium', label: 'R$ 100 - R$ 1.000' },
              { value: 'high', label: 'Acima de R$ 1.000' }
            ],
            placeholder: 'Filtrar por valor'
          },
          {
            value: filters.vencimento || 'all',
            onChange: (value) => updateFilter('vencimento', value),
            options: [
              { value: 'all', label: 'Todos os Vencimentos' },
              { value: 'vencido', label: 'Vencidas' },
              { value: 'hoje', label: 'Vencem Hoje' },
              { value: 'proximo', label: 'Próximos 7 dias' },
              { value: 'futuro', label: 'Futuras' }
            ],
            placeholder: 'Filtrar por vencimento'
          }
        ]}
        onReset={resetFilters}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDebts.map((debt) => (
          <Card key={debt.id} className="bg-white border-[#DEE2E6]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg text-[#343A40] truncate">{debt.descricao}</CardTitle>
              {getStatusBadge(debt.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-[#343A40]"><strong>Cliente:</strong> {getClientName(debt.cliente_id)}</p>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#08872B]" />
                  <span className="text-lg font-bold text-[#08872B]">
                    R$ {debt.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                {debt.data_vencimento && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#6C757D]" />
                    <span className="text-[#343A40]">
                      Vence em: {new Date(debt.data_vencimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                
                <div className="mt-4 pt-2 border-t border-[#DEE2E6]">
                  <p className="text-xs text-[#6C757D]">
                    Cadastrado em: {new Date(debt.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDebts.length === 0 && debts.length > 0 && (
        <Card className="bg-white border-[#DEE2E6]">
          <CardContent className="text-center py-12">
            <p className="text-[#6C757D]">Nenhuma dívida encontrada com os filtros aplicados.</p>
            <Button 
              onClick={resetFilters}
              variant="outline"
              className="mt-4 border-[#DEE2E6] text-[#6C757D] hover:bg-[#F8F9FA]"
            >
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {debts.length === 0 && (
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
