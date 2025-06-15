
import { LocalClient } from './LocalDataService';
import { hybridDataManager } from './HybridDataManager';

export class ClientService {
  static async addClient(userId: string, clientData: Omit<LocalClient, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      console.log('🔄 ClientService: Adicionando cliente para usuário:', userId);
      const newClient = await hybridDataManager.addClient(userId, clientData);
      console.log('✅ ClientService: Cliente adicionado com sucesso:', newClient.id);
      return newClient;
    } catch (error) {
      console.error('❌ ClientService: Erro ao adicionar cliente:', error);
      throw error;
    }
  }

  static async updateClient(userId: string, id: string, updates: Partial<LocalClient>) {
    try {
      console.log('🔄 ClientService: Atualizando cliente:', id);
      await hybridDataManager.updateClient(userId, id, updates);
      console.log('✅ ClientService: Cliente atualizado com sucesso');
    } catch (error) {
      console.error('❌ ClientService: Erro ao atualizar cliente:', error);
      throw error;
    }
  }

  static async deleteClient(userId: string, id: string) {
    try {
      console.log('🔄 ClientService: Deletando cliente:', id);
      await hybridDataManager.deleteClient(userId, id);
      console.log('✅ ClientService: Cliente deletado com sucesso');
    } catch (error) {
      console.error('❌ ClientService: Erro ao deletar cliente:', error);
      throw error;
    }
  }

  static async getClientById(userId: string, clientId: string): Promise<LocalClient | null> {
    try {
      const userData = await hybridDataManager.loadUserData(userId);
      return userData.clients.find(client => client.id === clientId) || null;
    } catch (error) {
      console.error('❌ ClientService: Erro ao buscar cliente:', error);
      return null;
    }
  }

  static async getActiveClients(userId: string): Promise<LocalClient[]> {
    try {
      const userData = await hybridDataManager.loadUserData(userId);
      return userData.clients; // Removendo filtro por 'ativo' que não existe no tipo
    } catch (error) {
      console.error('❌ ClientService: Erro ao buscar clientes ativos:', error);
      return [];
    }
  }

  static async searchClients(userId: string, query: string): Promise<LocalClient[]> {
    try {
      const userData = await hybridDataManager.loadUserData(userId);
      const searchTerm = query.toLowerCase();
      return userData.clients.filter(client => 
        client.nome.toLowerCase().includes(searchTerm) ||
        client.whatsapp.includes(query) || // Corrigido: whatsapp em vez de telefone
        client.email?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('❌ ClientService: Erro ao buscar clientes:', error);
      return [];
    }
  }
}
