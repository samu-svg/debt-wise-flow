
import React, { useState, useEffect, memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import { toast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Search, 
  Filter,
  RefreshCw,
  Send,
  Copy,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import type { WhatsAppTemplate } from '@/types/whatsapp';

const templateStatusConfig = {
  approved: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bg: 'bg-green-50',
    variant: 'default' as const,
    label: 'Aprovado'
  },
  pending: { 
    icon: Clock, 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50',
    variant: 'secondary' as const,
    label: 'Pendente'
  },
  rejected: { 
    icon: AlertCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-50',
    variant: 'destructive' as const,
    label: 'Rejeitado'
  }
};

const categoryConfig = {
  marketing: { label: 'Marketing', color: 'text-purple-600' },
  utility: { label: 'Utilitário', color: 'text-blue-600' },
  authentication: { label: 'Autenticação', color: 'text-green-600' }
};

const TemplateCard = memo(({ 
  template, 
  onPreview, 
  onSendTest 
}: { 
  template: WhatsAppTemplate;
  onPreview: (template: WhatsAppTemplate) => void;
  onSendTest: (template: WhatsAppTemplate) => void;
}) => {
  const statusInfo = templateStatusConfig[template.status] || templateStatusConfig.pending;
  const categoryInfo = categoryConfig[template.category] || categoryConfig.utility;
  const StatusIcon = statusInfo.icon;

  const copyTemplateName = () => {
    navigator.clipboard.writeText(template.name);
    toast({
      title: "Nome copiado!",
      description: `Template "${template.name}" copiado para a área de transferência`,
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={statusInfo.variant} className="text-xs">
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
              <Badge variant="outline" className={`text-xs ${categoryInfo.color}`}>
                {categoryInfo.label}
              </Badge>
            </div>
            
            <h3 className="font-medium text-sm sm:text-base truncate mb-1" title={template.name}>
              {template.name}
            </h3>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span>ID: {template.id}</span>
              <span>•</span>
              <span>{template.language.toUpperCase()}</span>
            </div>
            
            {template.components.length > 0 && (
              <div className="text-xs text-gray-600">
                {template.components.length} componente(s)
              </div>
            )}
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(template)}
              className="flex items-center gap-1 text-xs"
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">Ver</span>
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={copyTemplateName}
              className="flex items-center gap-1 text-xs"
            >
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Copiar</span>
            </Button>
            
            {template.status === 'approved' && (
              <Button
                size="sm"
                onClick={() => onSendTest(template)}
                className="flex items-center gap-1 text-xs"
              >
                <Send className="w-3 h-3" />
                <span className="hidden sm:inline">Testar</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TemplateCard.displayName = 'TemplateCard';

const MessageTemplates = memo(() => {
  const { templates, loadTemplates, isLoading, connection } = useWhatsAppCloudAPI();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WhatsAppTemplate['status'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<WhatsAppTemplate['category'] | 'all'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);

  useEffect(() => {
    if (connection.isConnected) {
      loadTemplates();
    }
  }, [connection.isConnected, loadTemplates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = !searchTerm || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [templates, searchTerm, statusFilter, categoryFilter]);

  const templateStats = useMemo(() => {
    const stats = templates.reduce((acc, template) => {
      acc[template.status] = (acc[template.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: templates.length,
      approved: stats.approved || 0,
      pending: stats.pending || 0,
      rejected: stats.rejected || 0
    };
  }, [templates]);

  const handlePreview = (template: WhatsAppTemplate) => {
    setPreviewTemplate(template);
  };

  const handleSendTest = (template: WhatsAppTemplate) => {
    // TODO: Implementar envio de teste
    toast({
      title: "Função em desenvolvimento",
      description: "O envio de templates de teste será implementado em breve",
      variant: "destructive"
    });
  };

  const handleRefresh = () => {
    if (connection.isConnected) {
      loadTemplates();
      toast({
        title: "Templates atualizados",
        description: "Lista de templates recarregada com sucesso",
      });
    }
  };

  if (!connection.isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">WhatsApp não conectado</p>
            <p className="text-sm text-gray-500">
              Configure e conecte sua API para visualizar os templates
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header com Stats */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MessageSquare className="w-5 h-5" />
                Templates de Mensagem
              </CardTitle>
              <CardDescription className="text-sm">
                {templateStats.total} templates • {templateStats.approved} aprovados
              </CardDescription>
            </div>
            
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>

          {/* Status Stats */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              {templateStats.approved} Aprovados
            </Badge>
            <Badge variant="outline" className="text-yellow-600">
              <Clock className="w-3 h-3 mr-1" />
              {templateStats.pending} Pendentes
            </Badge>
            <Badge variant="outline" className="text-red-600">
              <AlertCircle className="w-3 h-3 mr-1" />
              {templateStats.rejected} Rejeitados
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os status</option>
              <option value="approved">Aprovados</option>
              <option value="pending">Pendentes</option>
              <option value="rejected">Rejeitados</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as categorias</option>
              <option value="marketing">Marketing</option>
              <option value="utility">Utilitário</option>
              <option value="authentication">Autenticação</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Templates */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-96 w-full">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Carregando templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                <p className="text-gray-600 mb-2">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Nenhum template encontrado com os filtros aplicados'
                    : 'Nenhum template encontrado'}
                </p>
                <p className="text-sm text-gray-500">
                  {templates.length === 0 
                    ? 'Configure templates no Facebook Business Manager'
                    : 'Tente ajustar os filtros de busca'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={handlePreview}
                    onSendTest={handleSendTest}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <Card className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Preview: {previewTemplate.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Informações:</p>
                  <div className="text-xs space-y-1 bg-gray-50 p-3 rounded">
                    <p><strong>ID:</strong> {previewTemplate.id}</p>
                    <p><strong>Status:</strong> {previewTemplate.status}</p>
                    <p><strong>Categoria:</strong> {previewTemplate.category}</p>
                    <p><strong>Idioma:</strong> {previewTemplate.language}</p>
                  </div>
                </div>
                
                {previewTemplate.components.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Componentes:</p>
                    <div className="space-y-2">
                      {previewTemplate.components.map((component, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded text-xs">
                          <p><strong>Tipo:</strong> {component.type}</p>
                          {component.text && (
                            <p><strong>Texto:</strong> {component.text}</p>
                          )}
                          {component.parameters && component.parameters.length > 0 && (
                            <p><strong>Parâmetros:</strong> {component.parameters.join(', ')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
});

MessageTemplates.displayName = 'MessageTemplates';

export default MessageTemplates;
