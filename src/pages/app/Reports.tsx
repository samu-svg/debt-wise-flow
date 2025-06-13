import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { FileText, Plus } from 'lucide-react';

const Reports = () => {
  const { clients, exportData, importData } = useLocalStorage();
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `debt-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup criado!",
        description: "Seus dados foram exportados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro no backup",
        description: "Não foi possível criar o backup",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const success = importData(text);
      
      if (success) {
        toast({
          title: "Dados importados!",
          description: "Backup restaurado com sucesso",
        });
      } else {
        toast({
          title: "Erro na importação",
          description: "Arquivo inválido ou corrompido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível ler o arquivo",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const generateReport = () => {
    const allDebts = clients.flatMap(client => 
      client.debts.map(debt => ({ ...debt, clientName: client.name }))
    );

    const activeDebts = allDebts.filter(d => d.status === 'active');
    const overdueDebts = allDebts.filter(d => d.status === 'overdue');
    const paidDebts = allDebts.filter(d => d.status === 'paid');

    const totalOriginal = allDebts.reduce((sum, debt) => sum + debt.originalAmount, 0);
    const totalCurrent = allDebts.reduce((sum, debt) => sum + debt.currentAmount, 0);
    const totalPaid = allDebts.reduce((sum, debt) => 
      sum + debt.payments.reduce((pSum, payment) => pSum + payment.amount, 0), 0
    );

    const reportData = {
      gerado_em: new Date().toLocaleString('pt-BR'),
      resumo: {
        total_clientes: clients.length,
        total_dividas: allDebts.length,
        dividas_ativas: activeDebts.length,
        dividas_vencidas: overdueDebts.length,
        dividas_pagas: paidDebts.length,
        valor_original_total: totalOriginal,
        valor_atual_total: totalCurrent,
        total_recebido: totalPaid
      },
      clientes: clients.map(client => ({
        nome: client.name,
        email: client.email,
        telefone: client.phone,
        dividas: client.debts.map(debt => ({
          descricao: debt.description,
          valor_original: debt.originalAmount,
          valor_atual: debt.currentAmount,
          status: debt.status,
          vencimento: debt.dueDate,
          pagamentos: debt.payments.length
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Relatório gerado!",
      description: "Relatório completo exportado com sucesso",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const allDebts = clients.flatMap(client => 
    client.debts.map(debt => ({ ...debt, clientName: client.name }))
  );

  const totalOriginal = allDebts.reduce((sum, debt) => sum + debt.originalAmount, 0);
  const totalCurrent = allDebts.reduce((sum, debt) => sum + debt.currentAmount, 0);
  const totalPaid = allDebts.reduce((sum, debt) => 
    sum + debt.payments.reduce((pSum, payment) => pSum + payment.amount, 0), 0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#374151]">Relatórios e Backup</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#374151]">Backup dos Dados</CardTitle>
            <CardDescription className="text-[#6B7280]">
              Faça backup e restaure seus dados localmente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleExport} className="w-full bg-[#10B981] hover:bg-[#059669] text-white">
              <FileText className="w-4 h-4 mr-2" />
              Fazer Backup
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={importing}
              />
              <Button variant="outline" className="w-full border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]" disabled={importing}>
                <Plus className="w-4 h-4 mr-2" />
                {importing ? 'Importando...' : 'Restaurar Backup'}
              </Button>
            </div>
            
            <p className="text-xs text-[#6B7280] text-center">
              Seus dados são armazenados localmente no navegador
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#374151]">Relatório Completo</CardTitle>
            <CardDescription className="text-[#6B7280]">
              Gere um relatório detalhado de todos os dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generateReport} className="w-full bg-[#10B981] hover:bg-[#059669] text-white">
              <FileText className="w-4 h-4 mr-2" />
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-[#374151]">Resumo Atual</CardTitle>
          <CardDescription className="text-[#6B7280]">
            Visão geral dos dados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <p className="text-2xl font-bold text-[#10B981]">{clients.length}</p>
              <p className="text-sm text-[#6B7280]">Clientes</p>
            </div>
            <div className="text-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <p className="text-2xl font-bold text-[#10B981]">{allDebts.length}</p>
              <p className="text-sm text-[#6B7280]">Dívidas Total</p>
            </div>
            <div className="text-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <p className="text-2xl font-bold text-[#374151]">
                {formatCurrency(totalCurrent)}
              </p>
              <p className="text-sm text-[#6B7280]">Valor em Aberto</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#374151]">Valor Original Total:</span>
                <span className="font-medium text-[#374151]">{formatCurrency(totalOriginal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#374151]">Total Recebido:</span>
                <span className="font-medium text-[#10B981]">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#374151]">Dívidas Ativas:</span>
                <span className="font-medium text-[#374151]">{allDebts.filter(d => d.status === 'active').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#374151]">Dívidas Vencidas:</span>
                <span className="font-medium text-[#EF4444]">{allDebts.filter(d => d.status === 'overdue').length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
