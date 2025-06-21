
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save } from 'lucide-react';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

const MessageTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: '1',
      name: 'Lembrete de Pagamento',
      content: 'Olá {nome}, você tem uma pendência de R$ {valor} com vencimento em {data}.',
      variables: ['nome', 'valor', 'data']
    }
  ]);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id ? editingTemplate : t
      ));
      setEditingTemplate(null);
    }
  };

  const handleAddTemplate = () => {
    if (newTemplate.name && newTemplate.content) {
      const template: MessageTemplate = {
        id: Date.now().toString(),
        name: newTemplate.name,
        content: newTemplate.content,
        variables: extractVariables(newTemplate.content)
      };
      setTemplates([...templates, template]);
      setNewTemplate({ name: '', content: '' });
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Modelos de Mensagem</CardTitle>
          <CardDescription>
            Crie e gerencie modelos para automatizar suas mensagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Nome do Modelo</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Ex: Cobrança Amigável"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="template-content">Conteúdo da Mensagem</Label>
              <Textarea
                id="template-content"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                placeholder="Use {variavel} para campos dinâmicos"
                rows={4}
              />
            </div>
            
            <Button onClick={handleAddTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Modelo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex gap-1 mt-2">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setTemplates(templates.filter(t => t.id !== template.id))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingTemplate?.id === template.id ? (
                <div className="space-y-4">
                  <Textarea
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      content: e.target.value,
                      variables: extractVariables(e.target.value)
                    })}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveTemplate}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{template.content}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MessageTemplates;
