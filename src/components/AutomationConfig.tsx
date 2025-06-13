
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCollectionAutomation } from '@/hooks/useCollectionAutomation';
import { toast } from '@/hooks/use-toast';
import {
  Settings,
  Calendar,
  Clock,
  Zap,
  Save,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

const AutomationConfig = () => {
  const { config, stats, updateConfig, isProcessing } = useCollectionAutomation();
  const [formData, setFormData] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleEscalationChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      escalation: { ...prev.escalation, [field]: value }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateConfig(formData);
    setHasChanges(false);
    toast({
      title: "Configurações salvas!",
      description: "A automação foi configurada com sucesso"
    });
  };

  const addCheckTime = () => {
    const timeInput = document.getElementById('newCheckTime') as HTMLInputElement;
    if (timeInput && timeInput.value) {
      const newTimes = [...formData.checkTimes, timeInput.value];
      handleChange('checkTimes', newTimes);
      timeInput.value = '';
    }
  };

  const removeCheckTime = (index: number) => {
    const newTimes = formData.checkTimes.filter((_, i) => i !== index);
    handleChange('checkTimes', newTimes);
  };

  const addHoliday = () => {
    const dateInput = document.getElementById('newHoliday') as HTMLInputElement;
    if (dateInput && dateInput.value) {
      const newHolidays = [...formData.holidays, dateInput.value];
      handleChange('holidays', newHolidays);
      dateInput.value = '';
    }
  };

  const removeHoliday = (index: number) => {
    const newHolidays = formData.holidays.filter((_, i) => i !== index);
    handleChange('holidays', newHolidays);
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mensagens Enviadas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalSent}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Resposta</p>
                <p className="text-2xl font-bold text-green-600">{stats.responseRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversas Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingConversations}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversões Hoje</p>
                <p className="text-2xl font-bold text-purple-600">{stats.conversionsToday}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuração da Automação
              </CardTitle>
              <CardDescription>
                Configure a régua de cobrança automática
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={formData.enabled ? "default" : "secondary"}>
                {formData.enabled ? 'Ativo' : 'Inativo'}
              </Badge>
              {isProcessing && (
                <Badge variant="outline" className="animate-pulse">
                  Processando...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Configuração Principal */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Automação Ativa</Label>
              <p className="text-sm text-gray-600">
                Ativar/desativar a régua de cobrança automática
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => handleChange('enabled', checked)}
            />
          </div>

          {/* Horários de Verificação */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horários de Verificação
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.checkTimes.map((time, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="flex items-center gap-1"
                >
                  {time}
                  <button 
                    onClick={() => removeCheckTime(index)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                id="newCheckTime"
                type="time"
                placeholder="09:00"
              />
              <Button onClick={addCheckTime} variant="outline">
                Adicionar
              </Button>
            </div>
          </div>

          {/* Limites */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxMessages">Limite Diário de Mensagens</Label>
              <Input
                id="maxMessages"
                type="number"
                value={formData.maxMessagesPerDay}
                onChange={(e) => handleChange('maxMessagesPerDay', parseInt(e.target.value))}
                min="1"
                max="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responseTimeout">Timeout de Resposta (horas)</Label>
              <Input
                id="responseTimeout"
                type="number"
                value={formData.responseTimeout / (1000 * 60 * 60)}
                onChange={(e) => handleChange('responseTimeout', parseInt(e.target.value) * 1000 * 60 * 60)}
                min="1"
                max="168"
              />
            </div>
          </div>

          {/* Escalonamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Escalonamento por Dias de Atraso
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Lembrete Amigável (dias antes)</Label>
                <Input
                  type="number"
                  value={Math.abs(formData.escalation.beforeDue)}
                  onChange={(e) => handleEscalationChange('beforeDue', -Math.abs(parseInt(e.target.value)))}
                />
              </div>

              <div className="space-y-2">
                <Label>Urgência Moderada</Label>
                <Input
                  type="number"
                  value={formData.escalation.onDue}
                  onChange={(e) => handleEscalationChange('onDue', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tom Sério (dias)</Label>
                <Input
                  type="number"
                  value={formData.escalation.afterDue1}
                  onChange={(e) => handleEscalationChange('afterDue1', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Cobrança Formal (dias)</Label>
                <Input
                  type="number"
                  value={formData.escalation.afterDue7}
                  onChange={(e) => handleEscalationChange('afterDue7', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Último Aviso (dias)</Label>
                <Input
                  type="number"
                  value={formData.escalation.afterDue15}
                  onChange={(e) => handleEscalationChange('afterDue15', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Ameaça Protesto (dias)</Label>
                <Input
                  type="number"
                  value={formData.escalation.afterDue30}
                  onChange={(e) => handleEscalationChange('afterDue30', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Feriados */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Feriados (Não Enviar)
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.holidays.map((holiday, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="flex items-center gap-1"
                >
                  {new Date(holiday).toLocaleDateString('pt-BR')}
                  <button 
                    onClick={() => removeHoliday(index)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                id="newHoliday"
                type="date"
              />
              <Button onClick={addHoliday} variant="outline">
                Adicionar Feriado
              </Button>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationConfig;
