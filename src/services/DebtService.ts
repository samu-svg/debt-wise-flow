
import { LocalDebt } from './LocalDataService';
import { hybridDataManager } from './HybridDataManager';

export class DebtService {
  static async addDebt(userId: string, debtData: Omit<LocalDebt, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      console.log('🔄 DebtService: Adicionando dívida para usuário:', userId);
      const newDebt = await hybridDataManager.addDebt(userId, debtData);
      console.log('✅ DebtService: Dívida adicionada com sucesso:', newDebt.id);
      return newDebt;
    } catch (error) {
      console.error('❌ DebtService: Erro ao adicionar dívida:', error);
      throw error;
    }
  }

  static async updateDebt(userId: string, id: string, updates: Partial<LocalDebt>) {
    try {
      console.log('🔄 DebtService: Atualizando dívida:', id);
      await hybridDataManager.updateDebt(userId, id, updates);
      console.log('✅ DebtService: Dívida atualizada com sucesso');
    } catch (error) {
      console.error('❌ DebtService: Erro ao atualizar dívida:', error);
      throw error;
    }
  }

  static async deleteDebt(userId: string, id: string) {
    try {
      console.log('🔄 DebtService: Deletando dívida:', id);
      await hybridDataManager.deleteDebt(userId, id);
      console.log('✅ DebtService: Dívida deletada com sucesso');
    } catch (error) {
      console.error('❌ DebtService: Erro ao deletar dívida:', error);
      throw error;
    }
  }

  static async markAsPaid(userId: string, debtId: string) {
    try {
      await this.updateDebt(userId, debtId, { 
        status: 'pago',
        updatedAt: new Date().toISOString() // Usando updatedAt em vez de dataPagamento
      });
    } catch (error) {
      console.error('❌ DebtService: Erro ao marcar dívida como paga:', error);
      throw error;
    }
  }

  static async markAsOverdue(userId: string, debtId: string) {
    try {
      await this.updateDebt(userId, debtId, { status: 'atrasado' });
    } catch (error) {
      console.error('❌ DebtService: Erro ao marcar dívida como atrasada:', error);
      throw error;
    }
  }

  static async getOverdueDebts(userId: string): Promise<LocalDebt[]> {
    try {
      const userData = await hybridDataManager.loadUserData(userId);
      const today = new Date();
      
      return userData.debts.filter(debt => {
        if (debt.status === 'pago') return false;
        const dueDate = new Date(debt.dataVencimento);
        return dueDate < today;
      });
    } catch (error) {
      console.error('❌ DebtService: Erro ao buscar dívidas atrasadas:', error);
      return [];
    }
  }

  static async getDebtsByClient(userId: string, clientId: string): Promise<LocalDebt[]> {
    try {
      const userData = await hybridDataManager.loadUserData(userId);
      return userData.debts.filter(debt => debt.clientId === clientId); // Corrigido: clientId
    } catch (error) {
      console.error('❌ DebtService: Erro ao buscar dívidas do cliente:', error);
      return [];
    }
  }

  static async getTotalDebtAmount(userId: string): Promise<number> {
    try {
      const userData = await hybridDataManager.loadUserData(userId);
      return userData.debts
        .filter(debt => debt.status !== 'pago')
        .reduce((sum, debt) => sum + debt.valor, 0);
    } catch (error) {
      console.error('❌ DebtService: Erro ao calcular total de dívidas:', error);
      return 0;
    }
  }
}
