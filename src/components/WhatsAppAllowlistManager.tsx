
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWhatsAppAllowlist } from '@/hooks/useWhatsAppAllowlist';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Phone, 
  User, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Shield
} from 'lucide-react';

const WhatsAppAllowlistManager = () => {
  const { allowlist, isLoading, addNumber, removeNumber, toggleNumber } = useWhatsAppAllowlist();
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNumber = async () => {
    if (!newPhone.trim()) {
      toast({
        title: "Número obrigatório",
        description: "Digite um número de telefone",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      const success = await addNumber(newPhone, newName.trim() || undefined);
      if (success) {
        setNewPhone('');
        setNewName('');
        toast({
          title: "Número adicionado!",
          description: "O número foi adicionado à lista de aprovados",
        });
      } else {
        toast({
          title: "Erro ao adicionar",
          description: "Não foi possível adicionar o número",
          variant: "destructive"
        });
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveNumber = async (id: string, phoneNumber: string) => {
    const success = await removeNumber(id);
    if (success) {
      toast({
        title: "Número removido",
        description: `${phoneNumber} foi removido da lista`,
      });
    } else {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o número",
        variant: "destructive"
      });
    }
  };

  const handleToggleNumber = async (id: string, isActive: boolean, phoneNumber: string) => {
    const success = await toggleNumber(id, isActive);
    if (success) {
      toast({
        title: isActive ? "Número ativado" : "Número desativado",
        description: `${phoneNumber} foi ${isActive ? 'ativado' : 'desativado'}`,
      });
    } else {
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do número",
        variant: "destructive"
      });
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('55') && phone.length === 13) {
      return `+${phone.substring(0, 2)} (${phone.substring(2, 4)}) ${phone.substring(4, 9)}-${phone.substring(9)}`;
    }
    return `+${phone}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Lista de Números Aprovados
          </CardTitle>
          <CardDescription>
            Gerencie os números autorizados a receber mensagens via WhatsApp Cloud API.
            <br />
            <strong>Importante:</strong> No modo desenvolvimento, apenas números desta lista podem receber mensagens.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Aviso sobre modo desenvolvimento */}
      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            Modo Desenvolvimento Ativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-yellow-700">
            <p className="mb-2">
              Sua conta WhatsApp Business está em modo desenvolvimento.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Apenas números desta lista podem receber mensagens</li>
              <li>Máximo de 5 números permitidos</li>
              <li>Para enviar para qualquer número, solicite revisão do aplicativo no Meta Business</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Adicionar Novo Número */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Número
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Número de Telefone
              </Label>
              <Input
                id="phone"
                placeholder="11999999999"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Nome (opcional)
              </Label>
              <Input
                id="name"
                placeholder="João Silva"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={handleAddNumber}
            disabled={isAdding || !newPhone.trim()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isAdding ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Números */}
      <Card>
        <CardHeader>
          <CardTitle>
            Números Aprovados ({allowlist.filter(n => n.isActive).length}/5)
          </CardTitle>
          <CardDescription>
            Lista de números autorizados a receber mensagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : allowlist.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
              <p className="text-gray-600 mb-2">Nenhum número na lista</p>
              <p className="text-sm text-gray-500">
                Adicione números para começar a enviar mensagens
              </p>
            </div>
          ) : (
            <ScrollArea className="h-64 w-full">
              <div className="space-y-3">
                {allowlist.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-lg border transition-all ${
                      entry.isActive 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={entry.isActive ? "default" : "secondary"}
                            className={entry.isActive ? 'bg-green-100 text-green-800' : ''}
                          >
                            {entry.isActive ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {entry.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        
                        <p className="font-medium text-gray-900">
                          {formatPhoneNumber(entry.phoneNumber)}
                        </p>
                        
                        {entry.name && (
                          <p className="text-sm text-gray-600">{entry.name}</p>
                        )}
                        
                        <p className="text-xs text-gray-500">
                          Adicionado em {new Date(entry.addedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleNumber(entry.id, !entry.isActive, entry.phoneNumber)}
                          className="text-xs"
                        >
                          {entry.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveNumber(entry.id, entry.phoneNumber)}
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppAllowlistManager;
