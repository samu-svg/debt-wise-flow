
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';

export interface LocalDataStructure {
  clients: LocalClient[];
  debts: LocalDebt[];
  collectionHistory: CollectionMessage[];
  settings: UserSettings;
  metadata: {
    version: string;
    lastModified: string;
    userId: string;
    backupCount: number;
  };
}

export interface LocalClient {
  id: string;
  nome: string;
  whatsapp: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalDebt {
  id: string;
  clientId: string;
  valor: number;
  dataVencimento: string;
  status: 'pendente' | 'pago' | 'atrasado';
  descricao?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionMessage {
  id: string;
  clientId: string;
  debtId: string;
  data: string;
  tipoMensagem: string;
  statusEntrega: 'pendente' | 'enviada' | 'entregue' | 'erro';
  mensagem: string;
  templateUsado: string;
  erroDetalhes?: string;
}

export interface UserSettings {
  automacaoAtiva: boolean;
  diasAntesLembrete: number;
  diasAposVencimento: number[];
  templatesPersonalizados: Record<string, string>;
  horarioEnvio: string;
  updatedAt: string;
}

class LocalDataService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private userId: string | null = null;
  private userDataHandle: FileSystemDirectoryHandle | null = null;

  async initialize(directoryHandle: FileSystemDirectoryHandle, userId: string): Promise<void> {
    this.directoryHandle = directoryHandle;
    this.userId = userId;
    
    console.log('🔧 Inicializando LocalDataService para usuário:', userId);
    
    // Criar estrutura de pastas
    await this.ensureDirectoryStructure();
    console.log('✅ Estrutura de diretórios criada');
  }

  private async ensureDirectoryStructure(): Promise<void> {
    if (!this.directoryHandle || !this.userId) {
      throw new Error('Serviço não inicializado');
    }

    try {
      // Criar pasta user_data se não existir
      const userDataDir = await this.directoryHandle.getDirectoryHandle('user_data', { create: true });
      
      // Criar pasta específica do usuário
      this.userDataHandle = await userDataDir.getDirectoryHandle(this.userId, { create: true });
      
      // Criar pasta de backups
      await this.userDataHandle.getDirectoryHandle('backups', { create: true });
      
      console.log('📁 Estrutura de diretórios garantida para usuário:', this.userId);
    } catch (error) {
      console.error('❌ Erro ao criar estrutura de diretórios:', error);
      throw error;
    }
  }

  async saveData(data: LocalDataStructure): Promise<void> {
    if (!this.userDataHandle) {
      throw new Error('Serviço não inicializado');
    }

    try {
      console.log('💾 Salvando dados locais...');
      
      // Atualizar metadata
      data.metadata = {
        ...data.metadata,
        lastModified: new Date().toISOString(),
        userId: this.userId!,
        backupCount: (data.metadata?.backupCount || 0) + 1
      };

      // Salvar arquivo principal
      const mainFile = await this.userDataHandle.getFileHandle('data.json', { create: true });
      const writable = await mainFile.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      // Criar backup incremental
      await this.createIncrementalBackup(data);
      
      console.log('✅ Dados salvos com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      throw error;
    }
  }

  async loadData(): Promise<LocalDataStructure | null> {
    if (!this.userDataHandle) {
      throw new Error('Serviço não inicializado');
    }

    try {
      console.log('📖 Carregando dados locais...');
      
      const mainFile = await this.userDataHandle.getFileHandle('data.json');
      const file = await mainFile.getFile();
      const content = await file.text();
      const data = JSON.parse(content) as LocalDataStructure;
      
      // Validar integridade
      if (await this.validateDataIntegrity(data)) {
        console.log('✅ Dados carregados e validados');
        return data;
      } else {
        console.warn('⚠️ Dados corrompidos, tentando recuperar do backup');
        return await this.recoverFromBackup();
      }
    } catch (error) {
      if ((error as Error).name === 'NotFoundError') {
        console.log('📝 Arquivo de dados não encontrado, criando estrutura inicial');
        return this.createInitialData();
      }
      console.error('❌ Erro ao carregar dados:', error);
      throw error;
    }
  }

  private async createIncrementalBackup(data: LocalDataStructure): Promise<void> {
    try {
      const backupsDir = await this.userDataHandle!.getDirectoryHandle('backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = await backupsDir.getFileHandle(`backup_${timestamp}.json`, { create: true });
      
      const writable = await backupFile.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      
      // Limpar backups antigos (manter últimos 10)
      await this.cleanOldBackups(backupsDir);
      
      console.log('📦 Backup incremental criado:', `backup_${timestamp}.json`);
    } catch (error) {
      console.warn('⚠️ Erro ao criar backup (dados principais salvos):', error);
    }
  }

  private async cleanOldBackups(backupsDir: FileSystemDirectoryHandle): Promise<void> {
    try {
      const backups: string[] = [];
      
      for await (const [name] of backupsDir.entries()) {
        if (name.startsWith('backup_') && name.endsWith('.json')) {
          backups.push(name);
        }
      }
      
      backups.sort().reverse(); // Mais recentes primeiro
      
      // Remover backups excedentes
      if (backups.length > 10) {
        for (const oldBackup of backups.slice(10)) {
          await backupsDir.removeEntry(oldBackup);
          console.log('🗑️ Backup antigo removido:', oldBackup);
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao limpar backups antigos:', error);
    }
  }

  private async validateDataIntegrity(data: LocalDataStructure): Promise<boolean> {
    try {
      // Validações básicas
      if (!data || typeof data !== 'object') return false;
      if (!Array.isArray(data.clients)) return false;
      if (!Array.isArray(data.debts)) return false;
      if (!Array.isArray(data.collectionHistory)) return false;
      if (!data.settings || typeof data.settings !== 'object') return false;
      if (!data.metadata || typeof data.metadata !== 'object') return false;
      
      // Validar estrutura dos clientes
      for (const client of data.clients) {
        if (!client.id || !client.nome || !client.whatsapp) return false;
      }
      
      // Validar estrutura das dívidas
      for (const debt of data.debts) {
        if (!debt.id || !debt.clientId || typeof debt.valor !== 'number') return false;
      }
      
      console.log('✅ Integridade dos dados validada');
      return true;
    } catch (error) {
      console.error('❌ Erro na validação de integridade:', error);
      return false;
    }
  }

  private async recoverFromBackup(): Promise<LocalDataStructure | null> {
    try {
      const backupsDir = await this.userDataHandle!.getDirectoryHandle('backups');
      const backups: string[] = [];
      
      for await (const [name] of backupsDir.entries()) {
        if (name.startsWith('backup_') && name.endsWith('.json')) {
          backups.push(name);
        }
      }
      
      backups.sort().reverse(); // Mais recentes primeiro
      
      for (const backupName of backups) {
        try {
          const backupFile = await backupsDir.getFileHandle(backupName);
          const file = await backupFile.getFile();
          const content = await file.text();
          const data = JSON.parse(content) as LocalDataStructure;
          
          if (await this.validateDataIntegrity(data)) {
            console.log('🔄 Dados recuperados do backup:', backupName);
            return data;
          }
        } catch (error) {
          console.warn('⚠️ Backup corrompido:', backupName);
          continue;
        }
      }
      
      console.warn('❌ Nenhum backup válido encontrado');
      return this.createInitialData();
    } catch (error) {
      console.error('❌ Erro ao recuperar backup:', error);
      return this.createInitialData();
    }
  }

  private createInitialData(): LocalDataStructure {
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
        userId: this.userId!,
        backupCount: 0
      }
    };
  }

  async getBackupsList(): Promise<string[]> {
    try {
      const backupsDir = await this.userDataHandle!.getDirectoryHandle('backups');
      const backups: string[] = [];
      
      for await (const [name] of backupsDir.entries()) {
        if (name.startsWith('backup_') && name.endsWith('.json')) {
          backups.push(name);
        }
      }
      
      return backups.sort().reverse();
    } catch (error) {
      console.error('❌ Erro ao listar backups:', error);
      return [];
    }
  }

  async restoreFromBackup(backupName: string): Promise<LocalDataStructure | null> {
    try {
      const backupsDir = await this.userDataHandle!.getDirectoryHandle('backups');
      const backupFile = await backupsDir.getFileHandle(backupName);
      const file = await backupFile.getFile();
      const content = await file.text();
      const data = JSON.parse(content) as LocalDataStructure;
      
      if (await this.validateDataIntegrity(data)) {
        console.log('🔄 Restaurando do backup:', backupName);
        await this.saveData(data);
        return data;
      } else {
        throw new Error('Backup corrompido');
      }
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      throw error;
    }
  }
}

export const localDataService = new LocalDataService();
