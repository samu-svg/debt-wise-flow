
interface UserFolderConfig {
  userId: string;
  dataFolderPath: string;
  folderName: string;
  lastAccess: string;
  isValid: boolean;
}

interface FolderValidationResult {
  exists: boolean;
  hasWritePermission: boolean;
  hasUserData: boolean;
  error?: string;
}

class FolderPersistenceService {
  private dbName = 'DebtManagerFolders';
  private dbVersion = 3;
  private storeName = 'userFolders';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'userId' });
          store.createIndex('lastAccess', 'lastAccess', { unique: false });
        }
        
        // Criar store para handles se não existir
        if (!db.objectStoreNames.contains('directoryHandles')) {
          db.createObjectStore('directoryHandles', { keyPath: 'userId' });
        }
      };
    });
  }

  async saveUserFolderConfig(userId: string, handle: FileSystemDirectoryHandle): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName, 'directoryHandles'], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const config: UserFolderConfig = {
        userId,
        dataFolderPath: handle.name, // Browser limitation: can't get full path
        folderName: handle.name,
        lastAccess: new Date().toISOString(),
        isValid: true
      };

      // Salvar configuração no IndexedDB
      await store.put(config);

      // Salvar handle no store separado para uso direto
      const handleStore = transaction.objectStore('directoryHandles');
      
      await handleStore.put({
        userId,
        handle,
        savedAt: new Date().toISOString()
      });

      console.log('✅ Configuração de pasta salva para usuário:', userId);
    } catch (error) {
      console.error('❌ Erro ao salvar configuração da pasta:', error);
      throw error;
    }
  }

  async getUserFolderConfig(userId: string): Promise<UserFolderConfig | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.get(userId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (error) {
      console.error('❌ Erro ao recuperar configuração da pasta:', error);
      return null;
    }
  }

  async getDirectoryHandle(userId: string): Promise<FileSystemDirectoryHandle | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['directoryHandles'], 'readonly');
      const store = transaction.objectStore('directoryHandles');

      return new Promise((resolve, reject) => {
        const request = store.get(userId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.handle : null);
        };
      });
    } catch (error) {
      console.error('❌ Erro ao recuperar handle da pasta:', error);
      return null;
    }
  }

  async validateFolderAccess(handle: FileSystemDirectoryHandle, userId: string): Promise<FolderValidationResult> {
    const result: FolderValidationResult = {
      exists: false,
      hasWritePermission: false,
      hasUserData: false
    };

    try {
      // Testar acesso à pasta - corrigido para usar AsyncIterator corretamente
      const entriesIterable = handle.entries();
      const iterator = entriesIterable[Symbol.asyncIterator]();
      await iterator.next();
      result.exists = true;

      // Testar permissão de escrita
      const testFileName = `_test_write_${Date.now()}.tmp`;
      try {
        const testFile = await handle.getFileHandle(testFileName, { create: true });
        const writable = await testFile.createWritable();
        await writable.write('test');
        await writable.close();
        await handle.removeEntry(testFileName);
        result.hasWritePermission = true;
      } catch (writeError) {
        console.warn('⚠️ Sem permissão de escrita na pasta:', writeError);
        result.error = 'Sem permissão de escrita';
        return result;
      }

      // Verificar se existe estrutura de dados do usuário
      try {
        const userDataDir = await handle.getDirectoryHandle('user_data', { create: false });
        const userDir = await userDataDir.getDirectoryHandle(userId, { create: false });
        result.hasUserData = true;
      } catch {
        // Pasta de dados do usuário não existe ainda
        result.hasUserData = false;
      }

      console.log('✅ Validação da pasta concluída:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro na validação da pasta:', error);
      result.error = error instanceof Error ? error.message : 'Erro desconhecido';
      return result;
    }
  }

  async invalidateUserFolder(userId: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const config = await this.getUserFolderConfig(userId);
      if (config) {
        config.isValid = false;
        config.lastAccess = new Date().toISOString();
        await store.put(config);
      }

      console.log('⚠️ Pasta invalidada para usuário:', userId);
    } catch (error) {
      console.error('❌ Erro ao invalidar pasta:', error);
    }
  }

  async ensureUserDataStructure(handle: FileSystemDirectoryHandle, userId: string): Promise<void> {
    try {
      // Criar estrutura: /pasta_usuario/user_data/{user_id}/
      const userDataDir = await handle.getDirectoryHandle('user_data', { create: true });
      const userDir = await userDataDir.getDirectoryHandle(userId, { create: true });
      
      // Criar subpastas necessárias
      await userDir.getDirectoryHandle('backups', { create: true });
      
      console.log(`✅ Estrutura de dados criada para usuário: ${userId}`);
    } catch (error) {
      console.error('❌ Erro ao criar estrutura de dados:', error);
      throw error;
    }
  }

  async attemptAutoReconnect(userId: string): Promise<{ success: boolean; handle?: FileSystemDirectoryHandle; error?: string }> {
    try {
      console.log('🔄 Tentando reconexão automática para usuário:', userId);

      // Recuperar configuração salva
      const config = await this.getUserFolderConfig(userId);
      if (!config || !config.isValid) {
        return { success: false, error: 'Nenhuma configuração válida encontrada' };
      }

      // Recuperar handle da pasta
      const handle = await this.getDirectoryHandle(userId);
      if (!handle) {
        return { success: false, error: 'Handle da pasta não encontrado' };
      }

      // Validar acesso à pasta
      const validation = await this.validateFolderAccess(handle, userId);
      if (!validation.exists || !validation.hasWritePermission) {
        await this.invalidateUserFolder(userId);
        return { success: false, error: validation.error || 'Pasta inacessível' };
      }

      // Garantir estrutura de dados
      await this.ensureUserDataStructure(handle, userId);

      // Atualizar último acesso
      config.lastAccess = new Date().toISOString();
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.put(config);

      console.log('✅ Reconexão automática bem-sucedida:', handle.name);
      return { success: true, handle };
    } catch (error) {
      console.error('❌ Falha na reconexão automática:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }
}

export const folderPersistenceService = new FolderPersistenceService();
