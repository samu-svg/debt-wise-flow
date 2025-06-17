
import React, { memo } from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Activity,
  Send,
  Shield,
  MessageSquare,
  Bot,
  Settings,
  Heart,
  Bug,
  FileText
} from 'lucide-react';

interface WhatsAppTabsListProps {
  messages: Array<any>;
  allowlist: Array<{ isActive: boolean }>;
  logStats: { today: number };
}

const WhatsAppTabsList = memo(({ messages, allowlist, logStats }: WhatsAppTabsListProps) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 bg-gray-100 h-auto rounded-xl p-1">
        <TabsTrigger 
          value="overview" 
          className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
        >
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Visão Geral</span>
          <span className="sm:hidden">Geral</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="messages" 
          className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Mensagens</span>
          <span className="sm:hidden">📤</span>
          <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0.5">
            {messages.length}
          </Badge>
        </TabsTrigger>
        
        <TabsTrigger 
          value="allowlist" 
          className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm"
        >
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Lista</span>
          <span className="sm:hidden">📋</span>
          <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0.5">
            {allowlist.filter(n => n.isActive).length}
          </Badge>
        </TabsTrigger>
        
        <TabsTrigger 
          value="templates" 
          className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Templates</span>
          <span className="sm:hidden">Msgs</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="automation" 
          className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">Automação</span>
          <span className="sm:hidden">Auto</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="config" 
          className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Config</span>
          <span className="sm:hidden">⚙️</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="health" 
          className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
        >
          <Heart className="w-4 h-4" />
          <span className="hidden sm:inline">Saúde</span>
          <span className="sm:hidden">❤️</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="debug" 
          className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
        >
          <Bug className="w-4 h-4" />
          <span className="hidden sm:inline">Debug</span>
          <span className="sm:hidden">🐛</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="logs" 
          className="flex items-center gap-2 text-gray-600 p-3 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Logs</span>
          <span className="sm:hidden">📋</span>
          <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0.5">
            {logStats.today}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </div>
  );
});

WhatsAppTabsList.displayName = 'WhatsAppTabsList';

export default WhatsAppTabsList;
