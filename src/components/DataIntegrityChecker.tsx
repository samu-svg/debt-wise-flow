
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDataManager } from '@/hooks/useDataManager';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Info
} from 'lucide-react';

const DataIntegrityChecker = () => {
  const { refresh } = useDataManager();
  const { report, validateData, loading } = useDataIntegrity();
  const [isValidating, setIsValidating] = useState(false);

  const performValidation = async () => {
    setIsValidating(true);
    try {
      await validateData();
      console.log('✅ Validação concluída:', report);
    } catch (error) {
      console.error('❌ Erro na validação:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = () => {
    if (isValidating || loading) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (!report) return <Shield className="w-5 h-5" />;
    if (!report.isValid) return <XCircle className="w-5 h-5 text-red-500" />;
    if (report.warnings.length > 0) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getStatusText = () => {
    if (isValidating || loading) return 'Validando...';
    if (!report) return 'Não validado';
    if (!report.isValid) return 'Problemas encontrados';
    if (report.warnings.length > 0) return 'Avisos encontrados';
    return 'Dados íntegros';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle>Integridade dos Dados Supabase</CardTitle>
          </div>
          <Badge variant={report?.isValid ? 'default' : 'destructive'}>
            {getStatusText()}
          </Badge>
        </div>
        <CardDescription>
          Sistema de validação integrado com Supabase
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status de Validação */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">Status da Validação</p>
            <p className="text-xs text-muted-foreground">
              Sistema integrado com banco de dados Supabase
            </p>
          </div>
          <Button 
            onClick={performValidation}
            disabled={isValidating || loading}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Validando...' : 'Validar Agora'}
          </Button>
        </div>

        {/* Estatísticas */}
        {report && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{report.totalRecords}</div>
              <div className="text-xs text-blue-600">Total de Registros</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{report.errors.length}</div>
              <div className="text-xs text-green-600">Erros</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{report.warnings.length}</div>
              <div className="text-xs text-yellow-600">Avisos</div>
            </div>
          </div>
        )}

        {/* Erros */}
        {report && report.errors.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Problemas Encontrados ({report.errors.length})
            </h4>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {report.errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="text-sm">{error}</p>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Avisos */}
        {report && report.warnings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-yellow-500" />
              Avisos ({report.warnings.length})
            </h4>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {report.warnings.map((warning, index) => (
                <Alert key={index}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <p className="text-sm">{warning}</p>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Status Saudável */}
        {report && report.isValid && report.warnings.length === 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Todos os dados estão íntegros e consistentes no Supabase. Nenhum problema foi encontrado.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DataIntegrityChecker;
