
import { useState } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, X, FileText } from 'lucide-react';

const Clients = () => {
  const { clientes, dividas, addCliente, deleteCliente, loading } = useSupabaseData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.whatsapp) {
      toast({
        title: "Erro",
        description: "Preencha nome e WhatsApp obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await addCliente(formData);
      setFormData({ nome: '', email: '', whatsapp: '' });
      setIsDialogOpen(false);
      
      toast({
        title: "Cliente adicionado!",
        description: "Cliente cadastrado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o cliente",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${nome}?`)) {
      try {
        await deleteCliente(id);
        toast({
          title: "Cliente excluído",
          description: "Cliente removido com sucesso",
        });
      } catch (error) {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o cliente",
          variant: "destructive",
        });
      }
    }
  };

  const getClientDebts = (clientId: string) => {
    return dividas.filter(debt => debt.cliente_id === clientId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08872B] mx-auto"></div>
          <p className="mt-2 text-[#6C757D]">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#343A40]">Clientes</h1>
          <p className="text-[#6C757D]">{clientes.length} clientes cadastrados</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#08872B] hover:bg-[#059669] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-[#DEE2E6]">
            <DialogHeader>
              <DialogTitle className="text-[#343A40]">Cadastrar Novo Cliente</DialogTitle>
              <DialogDescription className="text-[#6C757D]">
                Preencha os dados do cliente para cadastro
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-[#343A40] font-medium">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="bg-white border-[#DEE2E6] text-[#343A40] focus:border-[#08872B]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-[#343A40] font-medium">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="bg-white border-[#DEE2E6] text-[#343A40] focus:border-[#08872B]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#343A40] font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="bg-white border-[#DEE2E6] text-[#343A40] focus:border-[#08872B]"
                />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientes.map((client) => {
          const clientDebts = getClientDebts(client.id);
          const activeDebts = clientDebts.filter(d => d.status === 'pendente' || d.status === 'atrasado');
          const totalAmount = activeDebts.reduce((sum, debt) => sum + debt.valor, 0);
          
          return (
            <Card key={client.id} className="bg-white border-[#DEE2E6]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg text-[#343A40]">{client.nome}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(client.id, client.nome)}
                  className="text-[#DC3545] hover:text-[#DC3545] hover:bg-[#F8F9FA]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-[#343A40]"><strong>WhatsApp:</strong> {client.whatsapp}</p>
                  {client.email && <p className="text-[#343A40]"><strong>Email:</strong> {client.email}</p>}
                  
                  <div className="mt-4 pt-2 border-t border-[#DEE2E6]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#08872B]" />
                      <span className="text-sm font-medium text-[#343A40]">Dívidas:</span>
                    </div>
                    <p className="text-xs text-[#6C757D] mt-1">
                      {activeDebts.length} ativas • R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-[#6C757D]">
                      Cadastrado em: {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {clientes.length === 0 && (
        <Card className="bg-white border-[#DEE2E6]">
          <CardContent className="text-center py-12">
            <p className="text-[#6C757D]">Nenhum cliente cadastrado ainda.</p>
            <p className="text-sm text-[#6C757D] mt-2">
              Clique em "Novo Cliente" para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Clients;
