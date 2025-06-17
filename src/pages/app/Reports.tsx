
import { useState } from 'react';
import { useDataManager } from '@/hooks/useDataManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { FileText, Download } from 'lucide-react';

const Reports = () => {
  const { clients, debts, messages, exportData, loading } = useDataManager();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-supabase-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup criado!",
        description: "Seus dados foram exportados do Supabase com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro no backup",
        description: "Não foi possível criar o backup",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const generateReport = () => {
    const totalOriginal = debts.reduce((sum, debt) => sum + debt.valor, 0);
    const totalCurrent = debts.filter(d => d.status !== 'pago').reduce((sum, debt) => sum + debt.valor, 0);
    const totalPaid = debts.filter(d => d.status === 'pago').reduce((sum, debt) => sum + debt.valor, 0);

    const reportData = {
      gerado_em: new Date().toLocaleString('pt-BR'),
      resumo: {
        total_clientes: clients.length,
        total_dividas: debts.length,
        dividas_ativas: debts.filter(d => d.status === 'pendente').length,
        dividas_vencidas: debts.filter(d => d.status === 'atrasado').length,
        dividas_pagas: debts.filter(d => d.status === 'pago').length,
        valor_original_total: totalOriginal,
        valor_atual_total: totalCurrent,
        total_recebido: totalPaid,
        mensagens_enviadas: messages.length
      },
      clientes: clients.map(client => ({
        nome: client.nome,
        email: client.email,
        whatsapp: client.whatsapp,
        dividas: debts.filter(d => d.cliente_id === client.id).map(debt => ({
          descricao: debt.descricao,
          valor: debt.valor,
          status: debt.status,
          vencimento: debt.data_vencimento,
          criado_em: debt.created_at
        }))
      })),
      fonte: 'Supabase Database'
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-supabase-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Relatório gerado!",
      description: "Relatório completo do Supabase exportado com sucesso",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalOriginal = debts.reduce((sum, debt) => sum + debt.valor, 0);
  const totalCurrent = debts.filter(d => d.status !== 'pago').reduce((sum, debt) => sum + debt.valor, 0);
  const totalPaid = debts.filter(d => d.status === 'pago').reduce((sum, debt) => sum + debt.valor, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08872B] mx-auto"></div>
          <p className="mt-2 text-[#6C757D]">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#374151]">Relatórios e Backup Supabase</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#374151]">Backup dos Dados</CardTitle>
            <CardDescription className="text-[#6B7280]">
              Faça backup dos dados armazenados no Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleExport} 
              disabled={exporting}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white"
            >
              <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-bounce' : ''}`} />
              {exporting ? 'Exportando...' : 'Fazer Backup do Supabase'}
            </Button>
            
            <p className="text-xs text-[#6B7280] text-center">
              Dados sincronizados automaticamente com a nuvem
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#374151]">Relatório Completo</CardTitle>
            <CardDescription className="text-[#6B7280]">
              Gere um relatório detalhado dos dados do Supabase
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
          <CardTitle className="text-[#374151]">Resumo Atual (Supabase)</CardTitle>
          <CardDescription className="text-[#6B7280]">
            Visão geral dos dados sincronizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <p className="text-2xl font-bold text-[#10B981]">{clients.length}</p>
              <p className="text-sm text-[#6B7280]">Clientes</p>
            </div>
            <div className="text-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <p className="text-2xl font-bold text-[#10B981]">{debts.length}</p>
              <p className="text-sm text-[#6B7280]">Dívidas Total</p>
            </div>
            <div className="text-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <p className="text-2xl font-bold text-[#374151]">
                {formatCurrency(totalCurrent)}
              </p>
              <p className="text-sm text-[#6B7280]">Valor em Aberto</p>
            </div>
            <div className="text-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <p className="text-2xl font-bold text-[#10B981]">{messages.length}</p>
              <p className="text-sm text-[#6B7280]">Mensagens</p>
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
                <span className="text-[#374151]">Dívidas Pendentes:</span>
                <span className="font-medium text-[#374151]">{debts.filter(d => d.status === 'pendente').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#374151]">Dívidas Atrasadas:</span>
                <span className="font-medium text-[#EF4444]">{debts.filter(d => d.status === 'atrasado').length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
