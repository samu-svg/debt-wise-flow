
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';
import { MessageTemplate } from '@/types/templates';
import TemplateEditor from './TemplateEditor';
import { toast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Plus,
  Edit3,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  FileText
} from 'lucide-react';

const MessageTemplates = () => {
  const { 
    templates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate,
    previewTemplate 
  } = useMessageTemplates();
  
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTemplate = (template: MessageTemplate) => {
    createTemplate(template);
    setIsCreating(false);
    toast({
      title: "Template criado!",
      description: "Novo template de mensagem foi criado com sucesso"
    });
  };

  const handleUpdateTemplate = (template: MessageTemplate) => {
    updateTemplate(template.id, template);
    setIsEditing(false);
    setSelectedTemplate(null);
    toast({
      title: "Template atualizado!",
      description: "As alterações foram salvas com sucesso"
    });
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplate(id);
      toast({
        title: "Template excluído",
        description: "Template foi removido com sucesso"
      });
    }
  };

  const toggleTemplateStatus = (template: MessageTemplate) => {
    updateTemplate(template.id, { isActive: !template.isActive });
    toast({
      title: template.isActive ? "Template desativado" : "Template ativado",
      description: template.isActive ? 
        "Template não será usado em envios automáticos" : 
        "Template está disponível para uso"
    });
  };

  const getTemplateTypeLabel = (type: MessageTemplate['type']) => {
    const types = {
      cobranca: 'Cobrança',
      lembrete: 'Lembrete',
      negociacao: 'Negociação',
      confirmacao: 'Confirmação'
    };
    return types[type] || type;
  };

  const getTemplateTypeColor = (type: MessageTemplate['type']) => {
    const colors = {
      cobranca: 'bg-red-100 text-red-800',
      lembrete: 'bg-yellow-100 text-yellow-800',
      negociacao: 'bg-blue-100 text-blue-800',
      confirmacao: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isCreating) {
    return (
      <TemplateEditor
        onSave={handleCreateTemplate}
        onCancel={() => setIsCreating(false)}
      />
    );
  }

  if (isEditing && selectedTemplate) {
    return (
      <TemplateEditor
        template={selectedTemplate}
        onSave={handleUpdateTemplate}
        onCancel={() => {
          setIsEditing(false);
          setSelectedTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Templates de Mensagem
          </h2>
          <p className="text-gray-600">
            Gerencie templates personalizados para suas mensagens de cobrança
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Template
        </Button>
      </div>

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getTemplateTypeColor(template.type)}>
                    {getTemplateTypeLabel(template.type)}
                  </Badge>
                  {template.isActive ? (
                    <ToggleRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.subject}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Preview do Conteúdo */}
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="line-clamp-4">
                    {template.content.substring(0, 150)}
                    {template.content.length > 150 && '...'}
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{template.variables.length} variáveis</span>
                  <span>{template.autoResponses.length} respostas automáticas</span>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsEditing(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    Editar
                  </Button>
                  
                  <Button
                    onClick={() => toggleTemplateStatus(template)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {template.isActive ? (
                      <ToggleLeft className="w-3 h-3" />
                    ) : (
                      <ToggleRight className="w-3 h-3" />
                    )}
                    {template.isActive ? 'Desativar' : 'Ativar'}
                  </Button>

                  <Button
                    onClick={() => handleDeleteTemplate(template.id)}
                    size="sm"
                    variant="destructive"
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Crie seu primeiro template de mensagem para começar
            </p>
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeiro Template
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageTemplates;
