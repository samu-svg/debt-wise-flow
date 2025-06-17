
import { useState, useEffect } from 'react';
import { useDataManager } from './useDataManager';

export interface CobrancaMetrics {
  totalClients: number;
  activeDebts: number;
  overdueDebts: number;
  totalAmount: number;
  overdueAmount: number;
  messagesSent: number;
  responseRate: number;
  
  // Propriedades adicionais para compatibilidade
  conexaoStatus: 'online' | 'offline';
  mensagensHoje: number;
  taxaResposta: number;
  conversasAtivas: number;
  valorTotalRecuperado: number;
  tempoMedioResposta: number;
  comprovantesRebidos: number;
  conversaoNegociacaoParaPagamento: number;
  palavrasChaveRespostas: Record<string, number>;
  relatorioEnviosDiario: Array<{
    data: string;
    enviadas: number;
    respondidas: number;
  }>;
  efetividadePorTemplate: Record<string, { taxa: number }>;
  taxaRecuperacaoPorValor: Record<string, { min: number; max: number; taxa: number }>;
  rankingClientesResponsivos: Array<{
    clienteId: string;
    nome: string;
    taxaResposta: number;
    valorRecuperado: number;
  }>;
  analiseEfetividadeSemanal: Array<{
    semana: string;
    taxa: number;
    valor: number;
  }>;
}

export interface NotificacaoAlerta {
  id?: string;
  tipo: 'sucesso' | 'aviso' | 'erro' | 'info';
  titulo: string;
  mensagem: string;
  timestamp: string;
  lida: boolean;
}

export const useCobrancaMetrics = () => {
  const { statistics, loading } = useDataManager();
  const [metrics, setMetrics] = useState<CobrancaMetrics>({
    totalClients: 0,
    activeDebts: 0,
    overdueDebts: 0,
    totalAmount: 0,
    overdueAmount: 0,
    messagesSent: 0,
    responseRate: 0,
    conexaoStatus: 'offline',
    mensagensHoje: 0,
    taxaResposta: 0,
    conversasAtivas: 0,
    valorTotalRecuperado: 0,
    tempoMedioResposta: 0,
    comprovantesRebidos: 0,
    conversaoNegociacaoParaPagamento: 0,
    palavrasChaveRespostas: {},
    relatorioEnviosDiario: [],
    efetividadePorTemplate: {},
    taxaRecuperacaoPorValor: {},
    rankingClientesResponsivos: [],
    analiseEfetividadeSemanal: []
  });

  const [alertas, setAlertas] = useState<NotificacaoAlerta[]>([]);

  useEffect(() => {
    if (!loading && statistics) {
      const mockData = {
        totalClients: statistics.totalClients,
        activeDebts: statistics.pendingDebts,
        overdueDebts: statistics.overdueDebts,
        totalAmount: statistics.totalAmount,
        overdueAmount: statistics.overdueAmount,
        messagesSent: statistics.messagesSent,
        responseRate: statistics.messagesTotal > 0 ? (statistics.messagesSent / statistics.messagesTotal) * 100 : 0,
        conexaoStatus: 'online' as const,
        mensagensHoje: Math.floor(Math.random() * 20) + 5,
        taxaResposta: Math.random() * 30 + 60,
        conversasAtivas: Math.floor(Math.random() * 10) + 2,
        valorTotalRecuperado: Math.random() * 5000 + 1000,
        tempoMedioResposta: Math.random() * 6 + 2,
        comprovantesRebidos: Math.floor(Math.random() * 5),
        conversaoNegociacaoParaPagamento: Math.random() * 20 + 70,
        palavrasChaveRespostas: {
          'ok': 12,
          'pago': 8,
          'amanhã': 5,
          'problema': 3
        },
        relatorioEnviosDiario: [
          { data: '2024-01-15', enviadas: 15, respondidas: 8 },
          { data: '2024-01-16', enviadas: 18, respondidas: 12 },
          { data: '2024-01-17', enviadas: 22, respondidas: 14 }
        ],
        efetividadePorTemplate: {
          'lembrete_amigavel': { taxa: 75 },
          'cobranca_formal': { taxa: 45 },
          'ultimo_aviso': { taxa: 35 }
        },
        taxaRecuperacaoPorValor: {
          'baixo': { min: 0, max: 100, taxa: 85 },
          'medio': { min: 100, max: 1000, taxa: 65 },
          'alto': { min: 1000, max: 10000, taxa: 45 }
        },
        rankingClientesResponsivos: [
          { clienteId: '1', nome: 'João Silva', taxaResposta: 95, valorRecuperado: 1200 },
          { clienteId: '2', nome: 'Maria Santos', taxaResposta: 88, valorRecuperado: 800 }
        ],
        analiseEfetividadeSemanal: [
          { semana: 'Sem 1', taxa: 65, valor: 3200 },
          { semana: 'Sem 2', taxa: 72, valor: 4100 },
          { semana: 'Sem 3', taxa: 58, valor: 2800 }
        ]
      };
      setMetrics(mockData);
    }
  }, [statistics, loading]);

  const adicionarAlerta = (alerta: Omit<NotificacaoAlerta, 'id'>) => {
    const novoAlerta = { ...alerta, id: Date.now().toString() };
    setAlertas(prev => [novoAlerta, ...prev]);
  };

  const marcarAlertaComoLido = (id: string) => {
    setAlertas(prev => prev.map(alerta => 
      alerta.id === id ? { ...alerta, lida: true } : alerta
    ));
  };

  const exportarRelatorio = (formato: 'excel' | 'pdf', dados: CobrancaMetrics) => {
    console.log(`Exportando relatório em ${formato}`, dados);
    // Implementação da exportação seria feita aqui
  };

  return {
    metrics,
    loading,
    alertas,
    configAlertas: {},
    adicionarAlerta,
    marcarAlertaComoLido,
    exportarRelatorio
  };
};
