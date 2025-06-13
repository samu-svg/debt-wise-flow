
import { useState, useEffect, useCallback } from 'react';
import { CobrancaMetrics, NotificacaoAlerta, ConfiguracaoAlerta, ClienteBlacklist, TestAB } from '@/types/dashboard';
import { useCollectionAutomation } from './useCollectionAutomation';
import { useLocalStorage } from './useLocalStorage';
import { useWhatsAppConnection } from './useWhatsAppConnection';

const STORAGE_KEYS = {
  METRICS: 'cobranca_metrics',
  ALERTAS: 'cobranca_alertas',
  CONFIG_ALERTAS: 'config_alertas',
  BLACKLIST: 'clientes_blacklist',
  TESTS_AB: 'tests_ab'
};

export const useCobrancaMetrics = () => {
  const [metrics, setMetrics] = useState<CobrancaMetrics | null>(null);
  const [alertas, setAlertas] = useState<NotificacaoAlerta[]>([]);
  const [configAlertas, setConfigAlertas] = useState<ConfiguracaoAlerta[]>([]);
  const [blacklist, setBlacklist] = useState<ClienteBlacklist[]>([]);
  const [testsAB, setTestsAB] = useState<TestAB[]>([]);
  
  const { communications } = useCollectionAutomation();
  const { clients } = useLocalStorage();
  const { connection } = useWhatsAppConnection();

  // Carregar dados do localStorage
  useEffect(() => {
    loadStoredData();
  }, []);

  // Atualizar métricas quando dados mudarem
  useEffect(() => {
    calculateMetrics();
  }, [communications, clients, connection]);

  const loadStoredData = () => {
    try {
      const storedMetrics = localStorage.getItem(STORAGE_KEYS.METRICS);
      const storedAlertas = localStorage.getItem(STORAGE_KEYS.ALERTAS);
      const storedConfigAlertas = localStorage.getItem(STORAGE_KEYS.CONFIG_ALERTAS);
      const storedBlacklist = localStorage.getItem(STORAGE_KEYS.BLACKLIST);
      const storedTestsAB = localStorage.getItem(STORAGE_KEYS.TESTS_AB);

      if (storedMetrics) setMetrics(JSON.parse(storedMetrics));
      if (storedAlertas) setAlertas(JSON.parse(storedAlertas));
      if (storedConfigAlertas) setConfigAlertas(JSON.parse(storedConfigAlertas));
      if (storedBlacklist) setBlacklist(JSON.parse(storedBlacklist));
      if (storedTestsAB) setTestsAB(JSON.parse(storedTestsAB));
    } catch (error) {
      console.error('Erro ao carregar dados das métricas:', error);
    }
  };

  const calculateMetrics = useCallback(() => {
    const now = new Date();
    const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const semanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const mesAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filtrar comunicações por período
    const comsHoje = communications.filter(c => new Date(c.sentAt) >= hoje);
    const comsSemana = communications.filter(c => new Date(c.sentAt) >= semanaAtras);
    const comsMes = communications.filter(c => new Date(c.sentAt) >= mesAtras);

    // Calcular métricas básicas
    const mensagensHoje = comsHoje.length;
    const mensagensSemana = comsSemana.length;
    const mensagensMes = comsMes.length;
    
    const respondidasHoje = comsHoje.filter(c => c.status === 'respondido').length;
    const taxaResposta = mensagensHoje > 0 ? (respondidasHoje / mensagensHoje) * 100 : 0;
    
    const conversasAtivas = communications.filter(c => 
      c.conversationState === 'AGUARDANDO' || c.conversationState === 'NEGOCIANDO'
    ).length;
    
    const comprovantesRebidos = communications.filter(c => 
      c.conversationState === 'COMPROVANTE'
    ).length;

    // Calcular valor recuperado (simulado)
    const valorTotalRecuperado = communications
      .filter(c => c.conversationState === 'FINALIZADO')
      .reduce((sum, c) => {
        const client = clients.find(cl => cl.id === c.clientId);
        const debt = client?.debts.find(d => d.id === c.debtId);
        return sum + (debt?.currentAmount || 0);
      }, 0);

    // Efetividade por template
    const efetividadePorTemplate: Record<string, any> = {};
    communications.forEach(c => {
      if (!efetividadePorTemplate[c.messageType]) {
        efetividadePorTemplate[c.messageType] = { enviadas: 0, respondidas: 0, taxa: 0 };
      }
      efetividadePorTemplate[c.messageType].enviadas++;
      if (c.status === 'respondido') {
        efetividadePorTemplate[c.messageType].respondidas++;
      }
    });

    Object.keys(efetividadePorTemplate).forEach(key => {
      const data = efetividadePorTemplate[key];
      data.taxa = data.enviadas > 0 ? (data.respondidas / data.enviadas) * 100 : 0;
    });

    // Melhor horário de envio por cliente
    const melhorHorarioEnvio: Record<string, any> = {};
    communications.forEach(c => {
      const hour = new Date(c.sentAt).getHours();
      const hourKey = `${hour}:00`;
      if (!melhorHorarioEnvio[c.clientId]) {
        melhorHorarioEnvio[c.clientId] = { hora: hourKey, taxaSucesso: 0 };
      }
    });

    // Taxa de recuperação por valor
    const taxaRecuperacaoPorValor = {
      baixo: { min: 0, max: 100, taxa: 65 },
      medio: { min: 100, max: 1000, taxa: 45 },
      alto: { min: 1000, max: 10000, taxa: 25 }
    };

    // Palavras-chave nas respostas
    const palavrasChaveRespostas: Record<string, number> = {};
    communications.forEach(c => {
      if (c.clientResponse) {
        const palavras = c.clientResponse.toLowerCase().split(' ');
        palavras.forEach(palavra => {
          if (palavra.length > 3) {
            palavrasChaveRespostas[palavra] = (palavrasChaveRespostas[palavra] || 0) + 1;
          }
        });
      }
    });

    // Tempo médio de resposta
    const respostasComTempo = communications.filter(c => c.responseAt);
    const tempoMedioResposta = respostasComTempo.length > 0 
      ? respostasComTempo.reduce((sum, c) => {
          const envio = new Date(c.sentAt).getTime();
          const resposta = new Date(c.responseAt!).getTime();
          return sum + (resposta - envio);
        }, 0) / respostasComTempo.length / (1000 * 60 * 60) // em horas
      : 0;

    // Conversão de negociação para pagamento
    const negociacoes = communications.filter(c => c.conversationState === 'NEGOCIANDO').length;
    const pagamentos = communications.filter(c => c.conversationState === 'FINALIZADO').length;
    const conversaoNegociacaoParaPagamento = negociacoes > 0 ? (pagamentos / negociacoes) * 100 : 0;

    // Relatórios
    const relatorioEnviosDiario = generateDailyReport(communications, clients);
    const analiseEfetividadeSemanal = generateWeeklyAnalysis(communications);
    const rankingClientesResponsivos = generateClientRanking(communications, clients);
    const historicoRecuperacao = generateRecoveryHistory(communications, clients);

    const newMetrics: CobrancaMetrics = {
      conexaoStatus: connection.isConnected ? 'online' : 'offline',
      mensagensHoje,
      mensagensSemana,
      mensagensMes,
      taxaResposta,
      conversasAtivas,
      comprovantesRebidos,
      valorTotalRecuperado,
      efetividadePorTemplate,
      melhorHorarioEnvio,
      taxaRecuperacaoPorValor,
      palavrasChaveRespostas,
      tempoMedioResposta,
      conversaoNegociacaoParaPagamento,
      relatorioEnviosDiario,
      analiseEfetividadeSemanal,
      rankingClientesResponsivos,
      historicoRecuperacao
    };

    setMetrics(newMetrics);
    localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(newMetrics));
  }, [communications, clients, connection]);

  const generateDailyReport = (comms: any[], clients: any[]) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayComms = comms.filter(c => c.sentAt.startsWith(dateStr));
      const respondidas = dayComms.filter(c => c.status === 'respondido').length;
      const recuperado = dayComms
        .filter(c => c.conversationState === 'FINALIZADO')
        .reduce((sum, c) => {
          const client = clients.find(cl => cl.id === c.clientId);
          const debt = client?.debts.find(d => d.id === c.debtId);
          return sum + (debt?.currentAmount || 0);
        }, 0);

      last7Days.push({
        data: dateStr,
        enviadas: dayComms.length,
        respondidas,
        recuperado
      });
    }
    return last7Days;
  };

  const generateWeeklyAnalysis = (comms: any[]) => {
    // Análise simplificada das últimas 4 semanas
    return [
      { semana: 'Semana 1', taxa: 65, valor: 5200 },
      { semana: 'Semana 2', taxa: 72, valor: 6800 },
      { semana: 'Semana 3', taxa: 58, valor: 4200 },
      { semana: 'Semana 4', taxa: 69, valor: 7100 }
    ];
  };

  const generateClientRanking = (comms: any[], clients: any[]) => {
    const clientStats: Record<string, any> = {};
    
    comms.forEach(c => {
      if (!clientStats[c.clientId]) {
        const client = clients.find(cl => cl.id === c.clientId);
        clientStats[c.clientId] = {
          clienteId: c.clientId,
          nome: client?.name || 'Cliente não encontrado',
          enviadas: 0,
          respondidas: 0,
          taxaResposta: 0,
          valorRecuperado: 0
        };
      }
      
      clientStats[c.clientId].enviadas++;
      if (c.status === 'respondido') {
        clientStats[c.clientId].respondidas++;
      }
      if (c.conversationState === 'FINALIZADO') {
        const client = clients.find(cl => cl.id === c.clientId);
        const debt = client?.debts.find(d => d.id === c.debtId);
        clientStats[c.clientId].valorRecuperado += debt?.currentAmount || 0;
      }
    });

    return Object.values(clientStats)
      .map((stat: any) => ({
        ...stat,
        taxaResposta: stat.enviadas > 0 ? (stat.respondidas / stat.enviadas) * 100 : 0
      }))
      .sort((a: any, b: any) => b.taxaResposta - a.taxaResposta)
      .slice(0, 10);
  };

  const generateRecoveryHistory = (comms: any[], clients: any[]) => {
    // Histórico simulado dos últimos 12 meses
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      months.push({
        mes: month,
        valorRecuperado: Math.floor(Math.random() * 10000) + 2000,
        dividas: Math.floor(Math.random() * 50) + 10
      });
    }
    return months;
  };

  const adicionarAlerta = useCallback((alerta: Omit<NotificacaoAlerta, 'id'>) => {
    const novoAlerta: NotificacaoAlerta = {
      ...alerta,
      id: Date.now().toString()
    };

    const novosAlertas = [novoAlerta, ...alertas].slice(0, 100); // Manter apenas 100 alertas
    setAlertas(novosAlertas);
    localStorage.setItem(STORAGE_KEYS.ALERTAS, JSON.stringify(novosAlertas));
  }, [alertas]);

  const marcarAlertaComoLido = useCallback((id: string) => {
    const alertasAtualizados = alertas.map(a => 
      a.id === id ? { ...a, lida: true } : a
    );
    setAlertas(alertasAtualizados);
    localStorage.setItem(STORAGE_KEYS.ALERTAS, JSON.stringify(alertasAtualizados));
  }, [alertas]);

  const adicionarClienteBlacklist = useCallback((clienteId: string, motivo: string) => {
    const novoItem: ClienteBlacklist = {
      clienteId,
      motivo,
      dataInclusao: new Date().toISOString(),
      ativo: true
    };

    const novaBlacklist = [...blacklist, novoItem];
    setBlacklist(novaBlacklist);
    localStorage.setItem(STORAGE_KEYS.BLACKLIST, JSON.stringify(novaBlacklist));
  }, [blacklist]);

  const criarTesteAB = useCallback((teste: Omit<TestAB, 'id'>) => {
    const novoTeste: TestAB = {
      ...teste,
      id: Date.now().toString()
    };

    const novosTests = [...testsAB, novoTeste];
    setTestsAB(novosTests);
    localStorage.setItem(STORAGE_KEYS.TESTS_AB, JSON.stringify(novosTests));
  }, [testsAB]);

  const exportarRelatorio = useCallback((tipo: 'excel' | 'pdf', dados: any) => {
    // Simular exportação
    const dataStr = JSON.stringify(dados, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_cobranca_${new Date().toISOString().split('T')[0]}.${tipo === 'excel' ? 'json' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    metrics,
    alertas,
    configAlertas,
    blacklist,
    testsAB,
    adicionarAlerta,
    marcarAlertaComoLido,
    adicionarClienteBlacklist,
    criarTesteAB,
    exportarRelatorio,
    calculateMetrics
  };
};
