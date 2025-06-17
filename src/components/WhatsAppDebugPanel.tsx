
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { useWhatsAppDiagnostics } from '@/hooks/useWhatsAppDiagnostics';
import { toast } from '@/hooks/use-toast';
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Send, 
  Loader2,
  Bug,
  Trash2,
  Phone,
  MessageSquare
} from 'lucide-react';

const WhatsAppDebugPanel = () => {
  const { config } = useWhatsAppCloudAPI();
  const { isRunning, lastResults, runFullDiagnostic, testSendMessage, clearResults } = useWhatsAppDiagnostics();
  
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Teste de mensagem do sistema de cobrança');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleRunDiagnostic = async () => {
    const results = await runFullDiagnostic(config);
    
    const hasErrors = results.some(r => !r.success);
    toast({
      title: hasErrors ? "Problemas encontrados" : "Diagnóstico concluído",
      description: hasErrors 
        ? "Verifique os resultados abaixo para detalhes dos problemas"
        : "Todos os testes passaram com sucesso",
      variant: hasErrors ? "destructive" : "default"
    });
  };

  const handleTestSend = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Preencha o número e a mensagem para teste",
        variant: "destructive"
      });
      return;
    }

    setIsSendingTest(true);
    try {
      const result = await testSendMessage(config, testPhone, testMessage);
      
      toast({
        title: result.success ? "Teste enviado!" : "Falha no teste",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-orange-600" />
            Painel de Diagnóstico WhatsApp
          </CardTitle>
          <CardDescription>
            Ferramentas para identificar e resolver problemas de envio de mensagens
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Controles Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diagnóstico Completo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="w-5 h-5" />
              Diagnóstico Completo
            </CardTitle>
            <CardDescription>
              Executa todos os testes de conectividade e configuração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleRunDiagnostic}
              disabled={isRunning}
              className="w-full flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? 'Executando...' : 'Executar Diagnóstico'}
            </Button>

            {lastResults.length > 0 && (
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  Últimos resultados: {lastResults.filter(r => r.success).length}/{lastResults.length} ✓
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearResults}
                  className="text-xs"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teste de Envio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="w-5 h-5" />
              Teste de Envio
            </CardTitle>
            <CardDescription>
              Envie uma mensagem de teste para validar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testPhone" className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Número (com DDD)
              </Label>
              <Input
                id="testPhone"
                placeholder="11999999999"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testMessage" className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Mensagem
              </Label>
              <Textarea
                id="testMessage"
                placeholder="Digite a mensagem de teste..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleTestSend}
              disabled={isSendingTest || !testPhone.trim() || !testMessage.trim()}
              className="w-full flex items-center gap-2"
            >
              {isSendingTest ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSendingTest ? 'Enviando...' : 'Enviar Teste'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resultados do Diagnóstico */}
      {lastResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Resultados do Diagnóstico
            </CardTitle>
            <CardDescription>
              Resultados detalhados da última execução
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80 w-full">
              <div className="space-y-3">
                {lastResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={result.success ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {result.success ? 'PASSOU' : 'FALHOU'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(result.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          {result.message}
                        </p>
                        
                        {result.details && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              Ver detalhes técnicos
                            </summary>
                            <pre className="mt-2 p-2 bg-white/60 rounded border overflow-x-auto text-gray-700">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppDebugPanel;
