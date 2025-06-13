
export interface CobrancaMetrics {
  // Métricas básicas
  conexaoStatus: 'online' | 'offline';
  mensagensHoje: number;
  mensagensSemana: number;
  mensagensMes: number;
  taxaResposta: number;
  conversasAtivas: number;
  comprovantesRebidos: number;
  valorTotalRecuperado: number;
  
  // Métricas avançadas
  efetividadePorTemplate: Record<string, {
    enviadas: number;
    respondidas: number;
    taxa: number;
  }>;
  
  melhorHorarioEnvio: Record<string, {
    hora: string;
    taxaSucesso: number;
  }>;
  
  taxaRecuperacaoPorValor: {
    baixo: { min: number; max: number; taxa: number };
    medio: { min: number; max: number; taxa: number };
    alto: { min: number; max: number; taxa: number };
  };
  
  palavrasChaveRespostas: Record<string, number>;
  tempoMedioResposta: number; // em horas
  conversaoNegociacaoParaPagamento: number;
  
  // Relatórios
  relatorioEnviosDiario: Array<{
    data: string;
    enviadas: number;
    respondidas: number;
    recuperado: number;
  }>;
  
  analiseEfetividadeSemanal: Array<{
    semana: string;
    taxa: number;
    valor: number;
  }>;
  
  rankingClientesResponsivos: Array<{
    clienteId: string;
    nome: string;
    taxaResposta: number;
    valorRecuperado: number;
  }>;
  
  historicoRecuperacao: Array<{
    mes: string;
    valorRecuperado: number;
    dividas: number;
  }>;
}

export interface NotificacaoAlerta {
  id: string;
  tipo: 'sucesso' | 'aviso' | 'erro' | 'info';
  titulo: string;
  mensagem: string;
  timestamp: string;
  lida: boolean;
}

export interface ConfiguracaoAlerta {
  id: string;
  nome: string;
  ativo: boolean;
  condicao: {
    tipo: 'taxa_resposta' | 'valor_recuperado' | 'mensagens_dia' | 'tempo_resposta';
    operador: 'maior_que' | 'menor_que' | 'igual_a';
    valor: number;
  };
  acao: {
    tipo: 'notificacao' | 'email' | 'webhook';
    destino?: string;
  };
}

export interface ClienteBlacklist {
  clienteId: string;
  motivo: string;
  dataInclusao: string;
  ativo: boolean;
}

export interface TestAB {
  id: string;
  nome: string;
  templateA: string;
  templateB: string;
  ativo: boolean;
  resultados: {
    templateA: { enviadas: number; respondidas: number };
    templateB: { enviadas: number; respondidas: number };
  };
  dataInicio: string;
  dataFim?: string;
}
