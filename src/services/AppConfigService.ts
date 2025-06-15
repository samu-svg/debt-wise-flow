
interface AppConfig {
  currentUserId: string;
  dataFolderPath: string;
  lastLogin: string;
  backupSettings: {
    autoBackup: boolean;
    backupInterval: number;
  };
}

interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  needsReconfiguration: boolean;
}

class AppConfigService {
  private dbName = 'DebtManagerConfig';
  private dbVersion = 1;
  private storeName = 'appConfig';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async saveConfig(config: AppConfig): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const configRecord = {
        id: 'main',
        ...config,
        updatedAt: new Date().toISOString()
      };

      await store.put(configRecord);
      console.log('✅ Configuração salva com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      throw error;
    }
  }

  async loadConfig(): Promise<AppConfig | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.get('main');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            const { id, updatedAt, ...config } = result;
            resolve(config as AppConfig);
          } else {
            resolve(null);
          }
        };
      });
    } catch (error) {
      console.error('❌ Erro ao carregar configuração:', error);
      return null;
    }
  }

  async validateConfig(config: AppConfig, currentUserId?: string): Promise<ConfigValidationResult> {
    const result: ConfigValidationResult = {
      isValid: true,
      errors: [],
      needsReconfiguration: false
    };

    // Validar user ID
    if (currentUserId && config.currentUserId !== currentUserId) {
      result.errors.push('Usuário atual não coincide com configuração salva');
      result.needsReconfiguration = true;
    }

    // Validar estrutura da configuração
    if (!config.dataFolderPath) {
      result.errors.push('Caminho da pasta não configurado');
      result.needsReconfiguration = true;
    }

    if (!config.backupSettings) {
      result.errors.push('Configurações de backup ausentes');
      result.isValid = false;
    }

    // Validar data do último login
    try {
      new Date(config.lastLogin);
    } catch {
      result.errors.push('Data do último login inválida');
      result.isValid = false;
    }

    if (result.errors.length > 0) {
      result.isValid = false;
    }

    return result;
  }

  async createDefaultConfig(userId: string): Promise<AppConfig> {
    const defaultConfig: AppConfig = {
      currentUserId: userId,
      dataFolderPath: '',
      lastLogin: new Date().toISOString(),
      backupSettings: {
        autoBackup: true,
        backupInterval: 24 // horas
      }
    };

    await this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  async updateUserSession(userId: string): Promise<void> {
    try {
      const config = await this.loadConfig();
      if (config) {
        config.currentUserId = userId;
        config.lastLogin = new Date().toISOString();
        await this.saveConfig(config);
      } else {
        await this.createDefaultConfig(userId);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar sessão do usuário:', error);
      throw error;
    }
  }

  async updateDataFolderPath(path: string): Promise<void> {
    try {
      const config = await this.loadConfig();
      if (config) {
        config.dataFolderPath = path;
        await this.saveConfig(config);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar caminho da pasta:', error);
      throw error;
    }
  }

  async clearConfig(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await store.delete('main');
      console.log('🔄 Configuração limpa');
    } catch (error) {
      console.error('❌ Erro ao limpar configuração:', error);
      throw error;
    }
  }
}

export const appConfigService = new AppConfigService();
