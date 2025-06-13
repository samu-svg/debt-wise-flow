import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageTemplate, TemplateVariable, AutoResponse } from '@/types/templates';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';
import { toast } from '@/hooks/use-toast';
import {
  Edit3,
  Eye,
  Save,
  Plus,
  Trash2,
  MessageSquare,
  Variable,
  Bot
} from 'lucide-react';

interface TemplateEditorProps {
  template?: MessageTemplate;
  onSave: (template: MessageTemplate) => void;
  onCancel: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSave, onCancel }) => {
  const { previewTemplate } = useMessageTemplates();
  const [formData, setFormData] = useState<Partial<MessageTemplate>>({
    name: '',
    type: 'cobranca',
    subject: '',
    content: '',
    variables: [],
    autoResponses: [],
    isActive: true
  });
  const [previewVariables, setPreviewVariables] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData(template);
      // Inicializar variáveis de preview com valores padrão
      const defaultVars: Record<string, any> = {};
      template.variables.forEach(variable => {
        defaultVars[variable.name] = variable.defaultValue || 
          (variable.type === 'currency' ? '100.00' :
           variable.type === 'number' ? '1' :
           variable.type === 'date' ? '2024-01-15' :
           `Exemplo ${variable.label}`);
      });
      setPreviewVariables(defaultVars);
    }
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e conteúdo são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const templateToSave: MessageTemplate = {
      id: template?.id || `template-${Date.now()}`,
      name: formData.name!,
      type: formData.type!,
      subject: formData.subject!,
      content: formData.content!,
      variables: formData.variables!,
      autoResponses: formData.autoResponses!,
      isActive: formData.isActive!,
      createdAt: template?.createdAt || new Date().toISOString()
    };

    onSave(templateToSave);
  };

  const addVariable = () => {
    const newVariable: TemplateVariable = {
      name: `variavel${(formData.variables?.length || 0) + 1}`,
      label: 'Nova Variável',
      type: 'text',
      required: false
    };

    setFormData(prev => ({
      ...prev,
      variables: [...(prev.variables || []), newVariable]
    }));
  };

  const updateVariable = (index: number, updates: Partial<TemplateVariable>) => {
    const updatedVariables = [...(formData.variables || [])];
    updatedVariables[index] = { ...updatedVariables[index], ...updates };
    
    setFormData(prev => ({
      ...prev,
      variables: updatedVariables
    }));
  };

  const removeVariable = (index: number) => {
    const updatedVariables = (formData.variables || []).filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      variables: updatedVariables
    }));
  };

  const addAutoResponse = () => {
    const newResponse: AutoResponse = {
      trigger: '',
      response: ''
    };

    setFormData(prev => ({
      ...prev,
      autoResponses: [...(prev.autoResponses || []), newResponse]
    }));
  };

  const updateAutoResponse = (index: number, updates: Partial<AutoResponse>) => {
    const updatedResponses = [...(formData.autoResponses || [])];
    updatedResponses[index] = { ...updatedResponses[index], ...updates };
    
    setFormData(prev => ({
      ...prev,
      autoResponses: updatedResponses
    }));
  };

  const removeAutoResponse = (index: number) => {
    const updatedResponses = (formData.autoResponses || []).filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      autoResponses: updatedResponses
    }));
  };

  const generatePreview = () => {
    if (formData.content && formData.variables) {
      return previewTemplate(formData as MessageTemplate, previewVariables);
    }
    return formData.content || '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            {template ? 'Editar Template' : 'Novo Template'}
          </CardTitle>
          <CardDescription>
            Configure seu template de mensagem personalizado
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Cobrança Padrão"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Assunto</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Ex: Cobrança Automática"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="content">Conteúdo da Mensagem</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite sua mensagem aqui... Use {variavel} para campos dinâmicos"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <Separator />

            {/* Variáveis */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Variable className="w-4 h-4" />
                  Variáveis Dinâmicas
                </h3>
                <Button type="button" onClick={addVariable} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {formData.variables?.map((variable, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Input
                        value={variable.name}
                        onChange={(e) => updateVariable(index, { name: e.target.value })}
                        placeholder="nome"
                        className="w-24 text-xs"
                      />
                      <Input
                        value={variable.label}
                        onChange={(e) => updateVariable(index, { label: e.target.value })}
                        placeholder="Label"
                        className="flex-1 text-xs"
                      />
                      <Button
                        type="button"
                        onClick={() => removeVariable(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Respostas Automáticas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Respostas Automáticas
                </h3>
                <Button type="button" onClick={addAutoResponse} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {formData.autoResponses?.map((response, index) => (
                    <div key={index} className="space-y-2 p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Input
                          value={response.trigger}
                          onChange={(e) => updateAutoResponse(index, { trigger: e.target.value })}
                          placeholder="TRIGGER"
                          className="w-32 text-xs"
                        />
                        <Button
                          type="button"
                          onClick={() => removeAutoResponse(index)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <Textarea
                        value={response.response}
                        onChange={(e) => updateAutoResponse(index, { response: e.target.value })}
                        placeholder="Resposta automática..."
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Salvar Template
              </Button>
              <Button type="button" onClick={onCancel} variant="outline">
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowPreview(!showPreview)} 
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Ocultar' : 'Preview'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Preview da Mensagem
            </CardTitle>
            <CardDescription>
              Visualize como a mensagem aparecerá para o cliente
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Campos de Preview */}
            <div className="space-y-2">
              <Label>Valores para Preview:</Label>
              <div className="grid grid-cols-2 gap-2">
                {formData.variables?.map((variable) => (
                  <div key={variable.name}>
                    <Label className="text-xs">{variable.label}</Label>
                    <Input
                      value={previewVariables[variable.name] || ''}
                      onChange={(e) => setPreviewVariables(prev => ({
                        ...prev,
                        [variable.name]: e.target.value
                      }))}
                      className="text-xs"
                      placeholder={`Exemplo ${variable.label}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Preview da Mensagem */}
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">WhatsApp Preview</Badge>
              </div>
              <div className="whitespace-pre-wrap text-sm font-mono bg-white p-3 rounded border">
                {generatePreview()}
              </div>
            </div>

            {/* Preview das Respostas Automáticas */}
            {formData.autoResponses && formData.autoResponses.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Respostas Automáticas:</Label>
                {formData.autoResponses.map((response, index) => (
                  <div key={index} className="bg-blue-50 p-2 rounded text-xs">
                    <Badge variant="outline" className="mb-1">{response.trigger}</Badge>
                    <p className="text-gray-700">{response.response}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TemplateEditor;
