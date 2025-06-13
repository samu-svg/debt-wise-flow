
import { useState } from 'react';
import { useLocalDataManager } from '@/hooks/useLocalDataManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, X, FileText } from 'lucide-react';

const Clients = () => {
  const { database, addClient, deleteClient, isLoaded } = useLocalDataManager();
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
      await addClient(formData);
      setFormData({ nome: '', email: '', whatsapp: '' });
      setIsDialogOpen(false);
      
      toast({
        title: "Cliente adicionado!",
        description: "Cliente cadastrado com sucesso e salvo na pasta local",
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
        await deleteClient(id);
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
    return database.debts.filter(debt => debt.clientId === clientId);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">{database.clients.length} clientes cadastrados</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha os dados do cliente para cadastro
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {database.clients.map((client) => {
          const clientDebts = getClientDebts(client.id);
          const activeDebts = clientDebts.filter(d => d.status === 'pendente' || d.status === 'atrasado');
          const totalAmount = activeDebts.reduce((sum, debt) => sum + debt.valor, 0);
          
          return (
            <Card key={client.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">{client.nome}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(client.id, client.nome)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>WhatsApp:</strong> {client.whatsapp}</p>
                  {client.email && <p><strong>Email:</strong> {client.email}</p>}
                  
                  <div className="mt-4 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Dívidas:</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {activeDebts.length} ativas • R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Cadastrado em: {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {database.clients.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Nenhum cliente cadastrado ainda.</p>
            <p className="text-sm text-gray-500 mt-2">
              Clique em "Novo Cliente" para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Clients;
