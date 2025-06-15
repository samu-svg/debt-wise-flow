
import { useAuth } from '@/hooks/useAuth';
import { localDataService, LocalDataStructure, LocalClient, LocalDebt, CollectionMessage, UserSettings } from './LocalDataService';
import { folderPersistenceService } from './FolderPersistenceService';

interface UserDataAccess {
  userId: string;
  isInitialized: boolean;
  directoryHandle: FileSystemDirectoryHandle | null;
}

class HybridDataManager {
  private currentUserAccess: UserDataAccess | null = null;
  private readonly STORAGE_PREFIX = 'debt_manager_user_';

  async initializeForUser(userId: string, directoryHandle?: FileSystemDirectoryHandle): Promise<void> {
    if (!userId) {
      throw new Error('User ID é obrigatório para inicialização');
    }

    // Validar se já está inicializado para este usuário
    if (this.currentUserAccess?.userId === userId && this.currentUserAccess.isInitialized) {
      console.log('✅ HybridDataManager já inicializado para usuário:', userId);
      return;
    }

    try {
      console.log('🔧 Inicializando HybridDataManager para usuário:', userId);

      let handle = directoryHandle;
      
      // Se não foi fornecido handle, tentar recuperar da configuração salva
      if (!handle) {
        handle = await folderPersistenceService.getDirectoryHandle(userId);
      }

      // Se temos handle, inicializar o serviço local
      if (handle) {
        await localDataService.initialize(handle, userId);
        
        // Validar que a estrutura de pastas está correta
        await this.validateUserDataStructure(handle, userId);
      }

      this.currentUserAccess = {
        userId,
        isInitialized: true,
        directoryHandle: handle
      };

      console.log('✅ HybridDataManager inicializado para usuário:', userId);
    } catch (error) {
      console.error('❌ Erro ao inicializar HybridDataManager:', error);
      throw error;
    }
  }

  private async validateUserDataStructure(handle: FileSystemDirectoryHandle, userId: string): Promise<void> {
    try {
      // Validar estrutura de diretórios específica do usuário
      const userDataDir = await handle.getDirectoryHandle('user_data', { create: true });
      const userDir = await userDataDir.getDirectoryHandle(userId, { create: true });
      const backupsDir = await userDir.getDirectoryHandle('backups', { create: true });
      
      console.log(`✅ Estrutura de dados validada para usuário: ${userId}`);
    } catch (error) {
      console.error('❌ Erro ao validar estrutura de dados:', error);
      throw error;
    }
  }

  private validateUserAccess(userId: string): void {
    if (!this.currentUserAccess || this.currentUserAccess.userId !== userId) {
      throw new Error(`Acesso negado: usuário ${userId} não está autorizado ou não inicializado`);
    }
    
    if (!this.currentUserAccess.isInitialized) {
      throw new Error(`Sistema não inicializado para usuário: ${userId}`);
    }
  }

  async loadUserData(userId: string): Promise<LocalDataStructure | null> {
    this.validateUserAccess(userId);
    
    try {
      if (this.currentUserAccess?.directoryHandle) {
        // Carregar dados do sistema de arquivos local
        return await localDataService.loadData();
      } else {
        // Fallback para localStorage com isolamento por usuário
        return await this.loadFromLocalStorage(userId);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error);
      return await this.loadFromLocalStorage(userId);
    }
  }

  async saveUserData(userId: string, data: LocalDataStructure): Promise<void> {
    this.validateUserAccess(userId);
    
    // Garantir que os dados pertencem ao usuário correto
    if (data.metadata.userId !== userId) {
      throw new Error(`Dados não pertencem ao usuário ${userId}`);
    }

    try {
      if (this.currentUserAccess?.directoryHandle) {
        // Salvar no sistema de arquivos local
        await localDataService.saveData(data);
      } else {
        // Fallback para localStorage com isolamento por usuário
        await this.saveToLocalStorage(userId, data);
      }
      
      console.log('✅ Dados salvos para usuário:', userId);
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      // Sempre tentar salvar no localStorage como backup
      await this.saveToLocalStorage(userId, data);
    }
  }

  private async loadFromLocalStorage(userId: string): Promise<LocalDataStructure | null> {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${userId}`;
      const saved = localStorage.getItem(storageKey);
      
      if (saved) {
        const parsedData = JSON.parse(saved);
        
        // Validar que os dados pertencem ao usuário correto
        if (parsedData.metadata?.userId !== userId) {
          console.warn('⚠️ Dados do localStorage não pertencem ao usuário atual');
          return this.createInitialUserData(userId);
        }
        
        console.log('📱 Dados carregados do localStorage para usuário:', userId);
        return parsedData;
      }
      
      return this.createInitialUserData(userId);
    } catch (error) {
      console.error('❌ Erro ao carregar do localStorage:', error);
      return this.createInitialUserData(userId);
    }
  }

  private async saveToLocalStorage(userId: string, data: LocalDataStructure): Promise<void> {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('💾 Dados salvos no localStorage para usuário:', userId);
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
      throw error;
    }
  }

  private createInitialUserData(userId: string): LocalDataStructure {
    return {
      clients: [],
      debts: [],
      collectionHistory: [],
      settings: {
        automacaoAtiva: false,
        diasAntesLembrete: 3,
        diasAposVencimento: [1, 7, 15, 30],
        templatesPersonalizados: {},
        horarioEnvio: '09:00',
        updatedAt: new Date().toISOString()
      },
      metadata: {
        version: '1.0',
        lastModified: new Date().toISOString(),
        userId: userId,
        backupCount: 0
      }
    };
  }

  async addClient(userId: string, clientData: Omit<LocalClient, 'id' | 'createdAt' | 'updatedAt'>): Promise<LocalClient | null> {
    this.validateUserAccess(userId);
    
    const currentData = await this.loadUserData(userId);
    if (!currentData) return null;

    const newClient: LocalClient = {
      ...clientData,
      id: `${userId}_${Date.now()}`, // Prefixar com userId para garantir unicidade
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    currentData.clients.push(newClient);
    currentData.metadata.lastModified = new Date().toISOString();
    
    await this.saveUserData(userId, currentData);
    return newClient;
  }

  async updateClient(userId: string, clientId: string, updates: Partial<LocalClient>): Promise<void> {
    this.validateUserAccess(userId);
    
    const currentData = await this.loadUserData(userId);
    if (!currentData) return;

    // Validar que o cliente pertence ao usuário
    if (!clientId.startsWith(userId)) {
      throw new Error('Cliente não pertence ao usuário atual');
    }

    currentData.clients = currentData.clients.map(client =>
      client.id === clientId
        ? { ...client, ...updates, updatedAt: new Date().toISOString() }
        : client
    );
    
    currentData.metadata.lastModified = new Date().toISOString();
    await this.saveUserData(userId, currentData);
  }

  async deleteClient(userId: string, clientId: string): Promise<void> {
    this.validateUserAccess(userId);
    
    const currentData = await this.loadUserData(userId);
    if (!currentData) return;

    // Validar que o cliente pertence ao usuário
    if (!clientId.startsWith(userId)) {
      throw new Error('Cliente não pertence ao usuário atual');
    }

    currentData.clients = currentData.clients.filter(client => client.id !== clientId);
    currentData.debts = currentData.debts.filter(debt => debt.clientId !== clientId);
    currentData.collectionHistory = currentData.collectionHistory.filter(msg => msg.clientId !== clientId);
    
    currentData.metadata.lastModified = new Date().toISOString();
    await this.saveUserData(userId, currentData);
  }

  async addDebt(userId: string, debtData: Omit<LocalDebt, 'id' | 'createdAt' | 'updatedAt'>): Promise<LocalDebt | null> {
    this.validateUserAccess(userId);
    
    const currentData = await this.loadUserData(userId);
    if (!currentData) return null;

    // Validar que o cliente pertence ao usuário
    if (!debtData.clientId.startsWith(userId)) {
      throw new Error('Cliente não pertence ao usuário atual');
    }

    const newDebt: LocalDebt = {
      ...debtData,
      id: `${userId}_debt_${Date.now()}`, // Prefixar com userId para garantir unicidade
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    currentData.debts.push(newDebt);
    currentData.metadata.lastModified = new Date().toISOString();
    
    await this.saveUserData(userId, currentData);
    return newDebt;
  }

  async updateDebt(userId: string, debtId: string, updates: Partial<LocalDebt>): Promise<void> {
    this.validateUserAccess(userId);
    
    const currentData = await this.loadUserData(userId);
    if (!currentData) return;

    // Validar que a dívida pertence ao usuário
    if (!debtId.startsWith(userId)) {
      throw new Error('Dívida não pertence ao usuário atual');
    }

    currentData.debts = currentData.debts.map(debt =>
      debt.id === debtId
        ? { ...debt, ...updates, updatedAt: new Date().toISOString() }
        : debt
    );
    
    currentData.metadata.lastModified = new Date().toISOString();
    await this.saveUserData(userId, currentData);
  }

  async deleteDebt(userId: string, debtId: string): Promise<void> {
    this.validateUserAccess(userId);
    
    const currentData = await this.loadUserData(userId);
    if (!currentData) return;

    // Validar que a dívida pertence ao usuário
    if (!debtId.startsWith(userId)) {
      throw new Error('Dívida não pertence ao usuário atual');
    }

    currentData.debts = currentData.debts.filter(debt => debt.id !== debtId);
    currentData.collectionHistory = currentData.collectionHistory.filter(msg => msg.debtId !== debtId);
    
    currentData.metadata.lastModified = new Date().toISOString();
    await this.saveUserData(userId, currentData);
  }

  async resetUserAccess(): Promise<void> {
    this.currentUserAccess = null;
    console.log('🔄 Acesso do usuário resetado');
  }

  getCurrentUserId(): string | null {
    return this.currentUserAccess?.userId || null;
  }

  isInitializedForUser(userId: string): boolean {
    return this.currentUserAccess?.userId === userId && this.currentUserAccess.isInitialized;
  }
}

export const hybridDataManager = new HybridDataManager();
