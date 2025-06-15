
import { hybridDataManager } from './HybridDataManager';
import { LocalDataStructure } from './LocalDataService';

interface Statistics {
  totalClients: number;
  totalDebts: number;
  pendingDebts: number;
  overdueDebts: number;
  paidDebts: number;
  totalAmount: number;
  overdueAmount: number;
  messagesTotal: number;
  messagesSent: number;
}

export class StatisticsService {
  static async getStatistics(userId: string): Promise<Statistics> {
    try {
      console.log('🔄 StatisticsService: Calculando estatísticas para usuário:', userId);
      const userData = await hybridDataManager.loadUserData(userId);
      return this.calculateStatistics(userData);
    } catch (error) {
      console.error('❌ StatisticsService: Erro ao calcular estatísticas:', error);
      return this.getDefaultStatistics();
    }
  }

  private static calculateStatistics(database: LocalDataStructure): Statistics {
    const totalClients = database.clients.length;
    const totalDebts = database.debts.length;
    const pendingDebts = database.debts.filter(d => d.status === 'pendente').length;
    const overdueDebts = database.debts.filter(d => d.status === 'atrasado').length;
    const paidDebts = database.debts.filter(d => d.status === 'pago').length;
    
    const totalAmount = database.debts
      .filter(d => d.status !== 'pago')
      .reduce((sum, debt) => sum + debt.valor, 0);
    
    const overdueAmount = database.debts
      .filter(d => d.status === 'atrasado')
      .reduce((sum, debt) => sum + debt.valor, 0);

    const messagesTotal = database.collectionHistory.length;
    const messagesSent = database.collectionHistory.filter(m => m.statusEntrega === 'enviada').length;

    console.log('✅ StatisticsService: Estatísticas calculadas:', {
      totalClients, totalDebts, pendingDebts, overdueDebts, paidDebts
    });

    return {
      totalClients,
      totalDebts,
      pendingDebts,
      overdueDebts,
      paidDebts,
      totalAmount,
      overdueAmount,
      messagesTotal,
      messagesSent
    };
  }

  private static getDefaultStatistics(): Statistics {
    return {
      totalClients: 0,
      totalDebts: 0,
      pendingDebts: 0,
      overdueDebts: 0,
      paidDebts: 0,
      totalAmount: 0,
      overdueAmount: 0,
      messagesTotal: 0,
      messagesSent: 0
    };
  }

  static async getClientStatistics(userId: string, clientId: string) {
    try {
      const userData = await hybridDataManager.loadUserData(userId);
      const clientDebts = userData.debts.filter(debt => debt.clienteId === clientId);
      
      return {
        totalDebts: clientDebts.length,
        pendingDebts: clientDebts.filter(d => d.status === 'pendente').length,
        overdueDebts: clientDebts.filter(d => d.status === 'atrasado').length,
        paidDebts: clientDebts.filter(d => d.status === 'pago').length,
        totalAmount: clientDebts.filter(d => d.status !== 'pago').reduce((sum, debt) => sum + debt.valor, 0),
        lastPayment: clientDebts
          .filter(d => d.status === 'pago' && d.dataPagamento)
          .sort((a, b) => new Date(b.dataPagamento!).getTime() - new Date(a.dataPagamento!).getTime())[0]?.dataPagamento
      };
    } catch (error) {
      console.error('❌ StatisticsService: Erro ao calcular estatísticas do cliente:', error);
      return null;
    }
  }
}
