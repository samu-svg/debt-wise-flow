
import { useState, useEffect, useCallback } from 'react';

interface FileSystemCapabilities {
  fileSystemAccess: boolean;
  permissions: boolean;
  fallbackSupport: boolean;
  isSecure: boolean;
  userAgent: string;
}

interface FileSystemOperation {
  type: 'read' | 'write' | 'directory';
  fallback?: 'download' | 'localStorage' | 'indexedDB';
}

interface FileSystemError {
  code: string;
  message: string;
  details?: any;
  retry?: boolean;
}

const RETRY_DELAYS = [1000, 2000, 4000, 8000]; // Backoff exponencial

export const useFileSystemManager = () => {
  const [capabilities, setCapabilities] = useState<FileSystemCapabilities | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastError, setLastError] = useState<FileSystemError | null>(null);

  // Detectar capacidades do sistema
  const detectCapabilities = useCallback(async (): Promise<FileSystemCapabilities> => {
    const caps: FileSystemCapabilities = {
      fileSystemAccess: false,
      permissions: false,
      fallbackSupport: true,
      isSecure: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      userAgent: navigator.userAgent
    };

    try {
      // Verificar File System Access API
      caps.fileSystemAccess = 'showDirectoryPicker' in window && 
                              'showOpenFilePicker' in window && 
                              'showSaveFilePicker' in window;

      // Verificar Permissions API
      caps.permissions = 'permissions' in navigator;

      // Teste prático de funcionamento
      if (caps.fileSystemAccess && caps.isSecure) {
        try {
          // Teste não intrusivo - apenas verificar se a API existe
          const hasPermission = await navigator.permissions?.query?.({ name: 'file-system-access' as any })
            .catch(() => null);
          
          // API existe e pode ser testada
          caps.fileSystemAccess = true;
        } catch (error) {
          console.warn('File System Access API disponível mas com restrições:', error);
          caps.fileSystemAccess = false;
        }
      }

      console.log('Capacidades detectadas:', caps);
      return caps;
    } catch (error) {
      console.error('Erro ao detectar capacidades:', error);
      return caps;
    }
  }, []);

  // Inicializar sistema
  useEffect(() => {
    const init = async () => {
      try {
        const caps = await detectCapabilities();
        setCapabilities(caps);
        setIsInitialized(true);
      } catch (error) {
        console.error('Erro na inicialização:', error);
        setLastError({
          code: 'INIT_ERROR',
          message: 'Falha ao inicializar sistema de arquivos',
          details: error
        });
        setIsInitialized(true);
      }
    };

    init();
  }, [detectCapabilities]);

  // Executar operação com retry
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    operationType: string = 'unknown'
  ): Promise<T> => {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = RETRY_DELAYS[Math.min(attempt - 1, RETRY_DELAYS.length - 1)];
          console.log(`Tentativa ${attempt + 1}/${maxRetries + 1} para ${operationType} em ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await operation();
        
        // Limpar erro anterior em caso de sucesso
        if (lastError) {
          setLastError(null);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`Tentativa ${attempt + 1} falhou para ${operationType}:`, error);

        // Não retry para erros do usuário (cancelamento)
        if (error.name === 'AbortError' || error.code === 'ABORT_ERR') {
          throw error;
        }

        // Não retry para erros de permissão permanentes
        if (error.name === 'NotAllowedError' && attempt >= 1) {
          break;
        }
      }
    }

    // Salvar último erro
    setLastError({
      code: lastError?.name || 'OPERATION_FAILED',
      message: `Falha em ${operationType} após ${maxRetries + 1} tentativas`,
      details: lastError,
      retry: true
    });

    throw lastError;
  }, []);

  // Lidar com acesso a diretório
  const handleDirectoryAccess = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    if (!capabilities?.fileSystemAccess || !window.showDirectoryPicker) {
      throw new Error('File System Access API não disponível');
    }

    return executeWithRetry(async () => {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      // Testar se conseguimos escrever
      try {
        const testFile = await handle.getFileHandle('test-write.tmp', { create: true });
        const writable = await testFile.createWritable();
        await writable.write('test');
        await writable.close();
        
        // Limpar arquivo de teste
        await handle.removeEntry('test-write.tmp').catch(() => {});
      } catch (error) {
        console.warn('Pasta selecionada pode ter restrições de escrita:', error);
      }

      return handle;
    }, 2, 'seleção de diretório');
  }, [capabilities, executeWithRetry]);

  // Salvar arquivo com fallbacks
  const saveFile = useCallback(async (
    data: string, 
    filename: string, 
    directoryHandle?: FileSystemDirectoryHandle | null
  ): Promise<boolean> => {
    // Método 1: File System Access API
    if (capabilities?.fileSystemAccess && directoryHandle) {
      try {
        return await executeWithRetry(async () => {
          const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(data);
          await writable.close();
          return true;
        }, 2, 'salvamento via File System API');
      } catch (error) {
        console.warn('Falha no File System API, tentando fallback:', error);
      }
    }

    // Fallback 1: Download tradicional
    try {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Arquivo salvo via download:', filename);
      return true;
    } catch (error) {
      console.error('Falha no fallback de download:', error);
    }

    // Fallback 2: LocalStorage para backups pequenos
    if (data.length < 5 * 1024 * 1024) { // < 5MB
      try {
        localStorage.setItem(`backup_${filename}`, data);
        console.log('Backup salvo no localStorage:', filename);
        return true;
      } catch (error) {
        console.error('Falha no localStorage:', error);
      }
    }

    return false;
  }, [capabilities, executeWithRetry]);

  // Verificar status de erro e sugestões
  const getErrorSuggestions = useCallback((error: FileSystemError): string[] => {
    const suggestions: string[] = [];

    switch (error.code) {
      case 'NotAllowedError':
        suggestions.push('Verifique as permissões do navegador');
        suggestions.push('Tente usar o modo incógnito');
        suggestions.push('Verifique políticas de segurança corporativas');
        break;
      case 'EACCES':
        suggestions.push('Execute o navegador como administrador');
        suggestions.push('Selecione uma pasta com permissões de escrita');
        suggestions.push('Verifique antivírus ou firewall');
        break;
      case 'INIT_ERROR':
        suggestions.push('Recarregue a página');
        suggestions.push('Use um navegador baseado em Chromium');
        suggestions.push('Verifique se está em HTTPS');
        break;
      default:
        suggestions.push('Tente novamente em alguns segundos');
        suggestions.push('Use o backup manual como alternativa');
    }

    return suggestions;
  }, []);

  // Reset de erro
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  // Status do sistema
  const getSystemStatus = useCallback(() => {
    if (!isInitialized) {
      return 'Inicializando...';
    }

    if (lastError) {
      return `Erro: ${lastError.message}`;
    }

    if (capabilities?.fileSystemAccess) {
      return 'Sistema completo disponível';
    }

    return 'Modo compatibilidade (download)';
  }, [isInitialized, lastError, capabilities]);

  return {
    capabilities,
    isInitialized,
    lastError,
    handleDirectoryAccess,
    saveFile,
    getErrorSuggestions,
    clearError,
    getSystemStatus,
    executeWithRetry
  };
};
