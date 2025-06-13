
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useCobrancaMetrics } from '@/hooks/useCobrancaMetrics';
import { ConfiguracaoAlerta, NotificacaoAlerta } from '@/types/dashboard';
import { 
  Bell,
  Plus,
  Trash2,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  X
} from 'lucide-react';

const AlertasConfig = () => {
  const { alertas, configAlertas, adicionarAlerta, marcarAlertaComoLido } = useCobrancaMetrics();
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [newAlertConfig, setNewAlertConfig] = useState<Partial<ConfiguracaoAlerta>>({
    nome: '',
    ativo: true,
    condicao: {
      tipo: 'taxa_resposta',
      operador: 'menor_que',
      valor: 50
    },
    acao: {
      tipo: 'notificacao'
    }
  });

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'sucesso': return CheckCircle;
      case 'aviso': return AlertTriangle;
      case 'erro': return X;
      default: return Info;
    }
  };

  const getAlertColor = (tipo: string) => {
    switch (tipo) {
      case 'sucesso': return 'text-green-600 bg-green-50';
      case 'aviso': return 'text-yellow-600 bg-yellow-50';
      case 'erro': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const handleCreateAlert = () => {
    if (newAlertConfig.nome) {
      // Simular criação de alerta
      adicionarAlerta({
        tipo: 'info',
        titulo: 'Nova Configuração de Alerta',
        mensagem: `Alerta "${newAlertConfig.nome}" criado com sucesso`,
        timestamp: new Date().toISOString(),
        lida: false
      });
      setShowNewAlert(false);
      setNewAlertConfig({
        nome: '',
        ativo: true,
        condicao: {
          tipo: 'taxa_resposta',
          operador: 'menor_que',
          valor: 50
        },
        acao: {
          tipo: 'notificacao'
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alertas e Notificações</h2>
          <p className="text-gray-600 mt-1">Configure alertas personalizados para monitorar métricas</p>
        </div>
        <Button onClick={() => setShowNewAlert(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Alerta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações Recentes
            </CardTitle>
            <CardDescription>
              Últimas notificações do sistema ({alertas.filter(a => !a.lida).length} não lidas)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alertas.slice(0, 10).map((alerta) => {
                const Icon = getAlertIcon(alerta.tipo);
                return (
                  <div
                    key={alerta.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      alerta.lida ? 'bg-gray-50' : 'bg-white border-blue-200'
                    }`}
                    onClick={() => !alerta.lida && marcarAlertaComoLido(alerta.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded ${getAlertColor(alerta.tipo)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{alerta.titulo}</h4>
                          {!alerta.lida && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alerta.mensagem}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(alerta.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {alertas.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Nenhuma notificação encontrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações de Alertas
            </CardTitle>
            <CardDescription>
              Gerenciar alertas automáticos do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Alertas padrão simulados */}
              {[
                { nome: 'Taxa de Resposta Baixa', ativo: true, condicao: 'Taxa < 40%' },
                { nome: 'Muitas Mensagens sem Resposta', ativo: true, condicao: 'Sem resposta > 10' },
                { nome: 'Meta Diária Atingida', ativo: false, condicao: 'Recuperação > R$ 5.000' },
                { nome: 'Conexão WhatsApp Perdida', ativo: true, condicao: 'Status = Offline' }
              ].map((config, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{config.nome}</p>
                    <p className="text-xs text-gray-600">{config.condicao}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={config.ativo} />
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal para Novo Alerta */}
      {showNewAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Novo Alerta</CardTitle>
              <CardDescription>Configure um novo alerta personalizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Alerta</label>
                <Input
                  value={newAlertConfig.nome}
                  onChange={(e) => setNewAlertConfig({...newAlertConfig, nome: e.target.value})}
                  placeholder="Ex: Taxa de resposta baixa"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Condição</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <select
                    value={newAlertConfig.condicao?.tipo}
                    onChange={(e) => setNewAlertConfig({
                      ...newAlertConfig,
                      condicao: {...newAlertConfig.condicao!, tipo: e.target.value as any}
                    })}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="taxa_resposta">Taxa Resposta</option>
                    <option value="valor_recuperado">Valor Recuperado</option>
                    <option value="mensagens_dia">Mensagens/Dia</option>
                    <option value="tempo_resposta">Tempo Resposta</option>
                  </select>
                  
                  <select
                    value={newAlertConfig.condicao?.operador}
                    onChange={(e) => setNewAlertConfig({
                      ...newAlertConfig,
                      condicao: {...newAlertConfig.condicao!, operador: e.target.value as any}
                    })}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="maior_que">Maior que</option>
                    <option value="menor_que">Menor que</option>
                    <option value="igual_a">Igual a</option>
                  </select>
                  
                  <Input
                    type="number"
                    value={newAlertConfig.condicao?.valor}
                    onChange={(e) => setNewAlertConfig({
                      ...newAlertConfig,
                      condicao: {...newAlertConfig.condicao!, valor: Number(e.target.value)}
                    })}
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Ação</label>
                <select
                  value={newAlertConfig.acao?.tipo}
                  onChange={(e) => setNewAlertConfig({
                    ...newAlertConfig,
                    acao: {...newAlertConfig.acao!, tipo: e.target.value as any}
                  })}
                  className="w-full px-2 py-1 border rounded text-sm mt-1"
                >
                  <option value="notificacao">Notificação</option>
                  <option value="email">Email</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowNewAlert(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAlert}>
                  Criar Alerta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AlertasConfig;
