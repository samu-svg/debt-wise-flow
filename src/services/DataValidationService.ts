
import { LocalDataStructure, LocalClient, LocalDebt, CollectionMessage } from './LocalDataService';
import { z } from 'zod';

// Schemas de validação usando Zod
const ClientSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  whatsapp: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  createdAt: z.string(),
  updatedAt: z.string()
});

const DebtSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  valor: z.number().positive(),
  dataVencimento: z.string(),
  status: z.enum(['pendente', 'pago', 'atrasado']),
  descricao: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const CollectionMessageSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  debtId: z.string().min(1),
  data: z.string(),
  tipoMensagem: z.string().min(1),
  statusEntrega: z.enum(['pendente', 'enviada', 'entregue', 'erro']),
  mensagem: z.string().min(1),
  templateUsado: z.string().min(1),
  erroDetalhes: z.string().optional()
});

const DataStructureSchema = z.object({
  clients: z.array(ClientSchema),
  debts: z.array(DebtSchema),
  collectionHistory: z.array(CollectionMessageSchema),
  settings: z.object({
    automacaoAtiva: z.boolean(),
    diasAntesLembrete: z.number().min(1),
    diasAposVencimento: z.array(z.number()),
    templatesPersonalizados: z.record(z.string()),
    horarioEnvio: z.string(),
    updatedAt: z.string()
  }),
  metadata: z.object({
    version: z.string(),
    lastModified: z.string(),
    userId: z.string(),
    backupCount: z.number().min(0)
  })
});

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

export interface ValidationError {
  type: 'schema' | 'reference' | 'duplicate' | 'corruption';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  path?: string;
  data?: any;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'outdated' | 'inconsistent' | 'performance';
  message: string;
  path?: string;
  suggestion?: string;
}

export interface ValidationStats {
  totalClients: number;
  totalDebts: number;
  totalMessages: number;
  orphanedDebts: number;
  orphanedMessages: number;
  duplicateIds: number;
  lastValidation: string;
}

class DataValidationService {
  
  async validateData(data: LocalDataStructure): Promise<ValidationResult> {
    console.log('🔍 Iniciando validação de integridade dos dados...');
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      // 1. Validação de Schema
      const schemaValidation = this.validateSchema(data);
      errors.push(...schemaValidation.errors);
      warnings.push(...schemaValidation.warnings);
      
      // 2. Validação de Referências
      const referenceValidation = this.validateReferences(data);
      errors.push(...referenceValidation.errors);
      warnings.push(...referenceValidation.warnings);
      
      // 3. Validação de Duplicatas
      const duplicateValidation = this.validateDuplicates(data);
      errors.push(...duplicateValidation.errors);
      
      // 4. Validação de Consistência
      const consistencyValidation = this.validateConsistency(data);
      warnings.push(...consistencyValidation.warnings);
      
      // 5. Calcular estatísticas
      const stats = this.calculateStats(data, errors);
      
      const isValid = errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0;
      
      console.log(`✅ Validação concluída: ${isValid ? 'DADOS VÁLIDOS' : 'PROBLEMAS ENCONTRADOS'}`);
      console.log(`📊 Erros: ${errors.length}, Avisos: ${warnings.length}`);
      
      return {
        isValid,
        errors,
        warnings,
        stats
      };
      
    } catch (error) {
      console.error('❌ Erro durante validação:', error);
      errors.push({
        type: 'corruption',
        severity: 'critical',
        message: 'Falha crítica na validação dos dados',
        data: error,
        suggestion: 'Restaurar dados de backup'
      });
      
      return {
        isValid: false,
        errors,
        warnings,
        stats: this.getEmptyStats()
      };
    }
  }
  
  private validateSchema(data: LocalDataStructure) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      DataStructureSchema.parse(data);
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => {
          errors.push({
            type: 'schema',
            severity: 'high',
            message: `Erro de schema: ${err.message}`,
            path: err.path?.join('.'),
            suggestion: 'Corrigir estrutura dos dados'
          });
        });
      }
    }
    
    // Validações adicionais de schema
    data.clients.forEach((client, index) => {
      try {
        ClientSchema.parse(client);
      } catch (error: any) {
        errors.push({
          type: 'schema',
          severity: 'medium',
          message: `Cliente inválido no índice ${index}`,
          path: `clients[${index}]`,
          data: client,
          suggestion: 'Corrigir dados do cliente'
        });
      }
    });
    
    data.debts.forEach((debt, index) => {
      try {
        DebtSchema.parse(debt);
      } catch (error: any) {
        errors.push({
          type: 'schema',
          severity: 'medium',
          message: `Dívida inválida no índice ${index}`,
          path: `debts[${index}]`,
          data: debt,
          suggestion: 'Corrigir dados da dívida'
        });
      }
    });
    
    return { errors, warnings };
  }
  
  private validateReferences(data: LocalDataStructure) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const clientIds = new Set(data.clients.map(c => c.id));
    const debtIds = new Set(data.debts.map(d => d.id));
    
    // Verificar referências de dívidas para clientes
    data.debts.forEach(debt => {
      if (!clientIds.has(debt.clientId)) {
        errors.push({
          type: 'reference',
          severity: 'high',
          message: `Dívida ${debt.id} referencia cliente inexistente: ${debt.clientId}`,
          path: `debts[${debt.id}].clientId`,
          suggestion: 'Remover dívida órfã ou criar cliente correspondente'
        });
      }
    });
    
    // Verificar referências de mensagens
    data.collectionHistory.forEach(message => {
      if (!clientIds.has(message.clientId)) {
        errors.push({
          type: 'reference',
          severity: 'medium',
          message: `Mensagem ${message.id} referencia cliente inexistente: ${message.clientId}`,
          path: `collectionHistory[${message.id}].clientId`,
          suggestion: 'Remover mensagem órfã'
        });
      }
      
      if (!debtIds.has(message.debtId)) {
        errors.push({
          type: 'reference',
          severity: 'medium',
          message: `Mensagem ${message.id} referencia dívida inexistente: ${message.debtId}`,
          path: `collectionHistory[${message.id}].debtId`,
          suggestion: 'Remover mensagem órfã'
        });
      }
    });
    
    return { errors, warnings };
  }
  
  private validateDuplicates(data: LocalDataStructure) {
    const errors: ValidationError[] = [];
    
    // Verificar IDs duplicados de clientes
    const clientIds = data.clients.map(c => c.id);
    const duplicateClientIds = clientIds.filter((id, index) => clientIds.indexOf(id) !== index);
    
    if (duplicateClientIds.length > 0) {
      errors.push({
        type: 'duplicate',
        severity: 'high',
        message: `IDs de clientes duplicados encontrados: ${duplicateClientIds.join(', ')}`,
        suggestion: 'Gerar novos IDs únicos para clientes duplicados'
      });
    }
    
    // Verificar IDs duplicados de dívidas
    const debtIds = data.debts.map(d => d.id);
    const duplicateDebtIds = debtIds.filter((id, index) => debtIds.indexOf(id) !== index);
    
    if (duplicateDebtIds.length > 0) {
      errors.push({
        type: 'duplicate',
        severity: 'high',
        message: `IDs de dívidas duplicados encontrados: ${duplicateDebtIds.join(', ')}`,
        suggestion: 'Gerar novos IDs únicos para dívidas duplicadas'
      });
    }
    
    // Verificar clientes com mesmo WhatsApp
    const whatsappNumbers = data.clients.map(c => c.whatsapp);
    const duplicateWhatsApp = whatsappNumbers.filter((num, index) => whatsappNumbers.indexOf(num) !== index);
    
    if (duplicateWhatsApp.length > 0) {
      errors.push({
        type: 'duplicate',
        severity: 'medium',
        message: `Números de WhatsApp duplicados: ${duplicateWhatsApp.join(', ')}`,
        suggestion: 'Verificar se são clientes diferentes com mesmo número'
      });
    }
    
    return { errors };
  }
  
  private validateConsistency(data: LocalDataStructure) {
    const warnings: ValidationWarning[] = [];
    
    // Verificar datas inconsistentes
    data.debts.forEach(debt => {
      if (new Date(debt.createdAt) > new Date(debt.updatedAt)) {
        warnings.push({
          type: 'inconsistent',
          message: `Dívida ${debt.id} tem data de criação posterior à atualização`,
          path: `debts[${debt.id}]`,
          suggestion: 'Corrigir timestamps da dívida'
        });
      }
    });
    
    // Verificar metadados desatualizados
    const lastModified = new Date(data.metadata.lastModified);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    if (lastModified < oneWeekAgo) {
      warnings.push({
        type: 'outdated',
        message: 'Dados não foram modificados há mais de uma semana',
        suggestion: 'Verificar se dados estão sendo atualizados corretamente'
      });
    }
    
    return { warnings };
  }
  
  private calculateStats(data: LocalDataStructure, errors: ValidationError[]): ValidationStats {
    const clientIds = new Set(data.clients.map(c => c.id));
    const debtIds = new Set(data.debts.map(d => d.id));
    
    const orphanedDebts = data.debts.filter(d => !clientIds.has(d.clientId)).length;
    const orphanedMessages = data.collectionHistory.filter(m => 
      !clientIds.has(m.clientId) || !debtIds.has(m.debtId)
    ).length;
    
    const duplicateIds = errors.filter(e => e.type === 'duplicate').length;
    
    return {
      totalClients: data.clients.length,
      totalDebts: data.debts.length,
      totalMessages: data.collectionHistory.length,
      orphanedDebts,
      orphanedMessages,
      duplicateIds,
      lastValidation: new Date().toISOString()
    };
  }
  
  private getEmptyStats(): ValidationStats {
    return {
      totalClients: 0,
      totalDebts: 0,
      totalMessages: 0,
      orphanedDebts: 0,
      orphanedMessages: 0,
      duplicateIds: 0,
      lastValidation: new Date().toISOString()
    };
  }
  
  // Função para reparar problemas automaticamente
  async repairData(data: LocalDataStructure, errors: ValidationError[]): Promise<LocalDataStructure> {
    console.log('🔧 Iniciando reparo automático dos dados...');
    
    let repairedData = JSON.parse(JSON.stringify(data)); // Deep clone
    
    for (const error of errors) {
      try {
        switch (error.type) {
          case 'reference':
            repairedData = this.repairReferences(repairedData, error);
            break;
          case 'duplicate':
            repairedData = this.repairDuplicates(repairedData, error);
            break;
          case 'schema':
            repairedData = this.repairSchema(repairedData, error);
            break;
        }
      } catch (repairError) {
        console.warn('⚠️ Não foi possível reparar automaticamente:', error.message);
      }
    }
    
    // Atualizar metadata após reparo
    repairedData.metadata.lastModified = new Date().toISOString();
    
    console.log('✅ Reparo automático concluído');
    return repairedData;
  }
  
  private repairReferences(data: LocalDataStructure, error: ValidationError): LocalDataStructure {
    if (error.path?.includes('debts') && error.path?.includes('clientId')) {
      // Remover dívidas órfãs
      data.debts = data.debts.filter(debt => 
        data.clients.some(client => client.id === debt.clientId)
      );
    }
    
    if (error.path?.includes('collectionHistory')) {
      // Remover mensagens órfãs
      const clientIds = new Set(data.clients.map(c => c.id));
      const debtIds = new Set(data.debts.map(d => d.id));
      
      data.collectionHistory = data.collectionHistory.filter(message =>
        clientIds.has(message.clientId) && debtIds.has(message.debtId)
      );
    }
    
    return data;
  }
  
  private repairDuplicates(data: LocalDataStructure, error: ValidationError): LocalDataStructure {
    if (error.message.includes('clientes duplicados')) {
      // Gerar novos IDs para clientes duplicados
      const seenIds = new Set<string>();
      data.clients = data.clients.map(client => {
        if (seenIds.has(client.id)) {
          return {
            ...client,
            id: `${data.metadata.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
        }
        seenIds.add(client.id);
        return client;
      });
    }
    
    return data;
  }
  
  private repairSchema(data: LocalDataStructure, error: ValidationError): LocalDataStructure {
    // Reparos básicos de schema
    if (error.path?.includes('email')) {
      const pathParts = error.path.split('.');
      const clientIndex = parseInt(pathParts[0].match(/\d+/)?.[0] || '0');
      if (data.clients[clientIndex]) {
        data.clients[clientIndex].email = data.clients[clientIndex].email || '';
      }
    }
    
    return data;
  }
  
  // Gerar checksum para verificação de integridade
  generateChecksum(data: LocalDataStructure): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
  
  // Verificar se dados foram corrompidos comparando checksums
  verifyIntegrity(data: LocalDataStructure, expectedChecksum: string): boolean {
    const currentChecksum = this.generateChecksum(data);
    return currentChecksum === expectedChecksum;
  }
}

export const dataValidationService = new DataValidationService();
