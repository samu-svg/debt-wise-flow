
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useLocalDataManager } from '@/hooks/useLocalDataManager';
import { dataValidationService, ValidationResult, ValidationError, ValidationWarning } from '@/services/DataValidationService';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wrench,
  RefreshCw,
  BarChart3,
  Info
} from 'lucide-react';

const DataIntegrityChecker = () => {
  const { database, refresh } = useLocalDataManager();
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  // Validação automática quando dados mudarem
  useEffect(() => {
    if (database && !isValidating) {
      performValidation();
    }
  }, [database]);

  const performValidation = async () => {
    if (!database) return;

    setIsValidating(true);
    try {
      console.log('🔍 Iniciando validação de integridade...');
      const result = await dataValidationService.validateData(database);
      setValidation(result);
      setLastCheck(new Date().toISOString());
      console.log('✅ Validação concluída:', result);
    } catch (error) {
      console.error('❌ Erro na validação:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const performRepair = async () => {
    if (!database || !validation || validation.errors.length === 0) return;

    setIsRepairing(true);
    try {
      console.log('🔧 Iniciando reparo automático...');
      const repairedData = await dataValidationService.repairData(database, validation.errors);
      
      // Aqui você salvaria os dados reparados usando o data manager
      // Por agora, apenas revalidamos
      await performValidation();
      await refresh();
      console.log('✅ Reparo concluído');
    } catch (error) {
      console.error('❌ Erro no reparo:', error);
    } finally {
      setIsRepairing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = () => {
    if (isValidating) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (!validation) return <Shield className="w-5 h-5" />;
    if (!validation.isValid) return <XCircle className="w-5 h-5 text-red-500" />;
    if (validation.warnings.length > 0) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getStatusText = () => {
    if (isValidating) return 'Validando...';
    if (!validation) return 'Não validado';
    if (!validation.isValid) return 'Problemas encontrados';
    if (validation.warnings.length > 0) return 'Avisos encontrados';
    return 'Dados íntegros';
  };

  const criticalErrors = validation?.errors.filter(e => e.severity === 'critical' || e.severity === 'high') || [];
  const canRepair = criticalErrors.some(e => e.type === 'reference' || e.type === 'duplicate');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle>Integridade dos Dados</CardTitle>
          </div>
          <Badge variant={validation?.isValid ? 'default' : 'destructive'}>
            {getStatusText()}
          </Badge>
        </div>
        <CardDescription>
          Sistema de validação e verificação de integridade dos dados
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status de Validação */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">Status da Validação</p>
            <p className="text-xs text-muted-foreground">
              {lastCheck ? `Última verificação: ${new Date(lastCheck).toLocaleString()}` : 'Nunca validado'}
            </p>
          </div>
          <Button 
            onClick={performValidation}
            disabled={isValidating || !database}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Validando...' : 'Validar Agora'}
          </Button>
        </div>

        {/* Estatísticas */}
        {validation && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{validation.stats.totalClients}</div>
              <div className="text-xs text-blue-600">Clientes</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{validation.stats.totalDebts}</div>
              <div className="text-xs text-green-600">Dívidas</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{validation.stats.totalMessages}</div>
              <div className="text-xs text-purple-600">Mensagens</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {validation.stats.orphanedDebts + validation.stats.orphanedMessages}
              </div>
              <div className="text-xs text-orange-600">Órfãos</div>
            </div>
          </div>
        )}

        {/* Erros Críticos */}
        {validation && validation.errors.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Problemas Encontrados ({validation.errors.length})
              </h4>
              {canRepair && (
                <Button 
                  onClick={performRepair}
                  disabled={isRepairing}
                  size="sm"
                  variant="outline"
                >
                  <Wrench className={`w-4 h-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} />
                  {isRepairing ? 'Reparando...' : 'Reparar Auto'}
                </Button>
              )}
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {validation.errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(error.severity) as any}>
                          {error.severity}
                        </Badge>
                        <span className="text-sm font-medium">{error.type}</span>
                      </div>
                      <p className="text-sm">{error.message}</p>
                      {error.path && (
                        <p className="text-xs text-muted-foreground">Caminho: {error.path}</p>
                      )}
                      {error.suggestion && (
                        <p className="text-xs text-blue-600">💡 {error.suggestion}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Avisos */}
        {validation && validation.warnings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-yellow-500" />
              Avisos ({validation.warnings.length})
            </h4>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {validation.warnings.map((warning, index) => (
                <Alert key={index}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{warning.type}</Badge>
                      </div>
                      <p className="text-sm">{warning.message}</p>
                      {warning.suggestion && (
                        <p className="text-xs text-blue-600">💡 {warning.suggestion}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Status Saudável */}
        {validation && validation.isValid && validation.warnings.length === 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Todos os dados estão íntegros e consistentes. Nenhum problema foi encontrado.
            </AlertDescription>
          </Alert>
        )}

        {/* Progresso da Validação */}
        {isValidating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Validando integridade...</span>
              <span>Processando...</span>
            </div>
            <Progress value={75} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataIntegrityChecker;
