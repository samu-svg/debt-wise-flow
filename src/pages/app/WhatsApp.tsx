
import React, { Suspense, lazy, memo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import EnhancedLoading from '@/components/ui/enhanced-loading';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useWhatsAppCloudAPI } from '@/hooks/useWhatsAppCloudAPI';
import WhatsAppHeader from '@/components/WhatsAppHeader';
import WhatsAppStatsCards from '@/components/WhatsAppStatsCards';
import WhatsAppTabsList from '@/components/WhatsAppTabsList';
import { 
  Activity,
  Heart,
  Bug,
  Bot,
  MessageSquare,
  Send,
  Settings,
  FileText,
  Shield
} from 'lucide-react';

// Lazy loading otimizado
const WhatsAppOverview = lazy(() => import('@/components/WhatsAppOverview'));
const WhatsAppLogs = lazy(() => import('@/components/WhatsAppLogs'));
const MessageTemplates = lazy(() => import('@/components/MessageTemplates'));
const WhatsAppConfig = lazy(() => import('@/components/WhatsAppConfig'));
const AutomationDashboard = lazy(() => import('@/components/AutomationDashboard'));
const WhatsAppDebugPanel = lazy(() => import('@/components/WhatsAppDebugPanel'));
const WhatsAppHealthDashboard = lazy(() => import('@/components/WhatsAppHealthDashboard'));
const WhatsAppAllowlistManager = lazy(() => import('@/components/WhatsAppAllowlistManager'));
const WhatsAppMessagesManager = lazy(() => import('@/components/WhatsAppMessagesManager'));

// Loading fallback otimizado
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center p-8 sm:p-12">
    <div className="text-center">
      <EnhancedLoading />
      <p className="text-gray-500 mt-4 text-sm">Carregando módulo...</p>
    </div>
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

const WhatsApp: React.FC = () => {
  const { 
    connection, 
    metrics, 
    logStats, 
    isConfigDirty, 
    messages, 
    allowlist,
    credentials
  } = useWhatsAppCloudAPI();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
          <WhatsAppHeader 
            connection={connection}
            isConfigDirty={isConfigDirty}
            credentials={credentials}
          />

          <WhatsAppStatsCards
            connection={connection}
            messages={messages}
            allowlist={allowlist}
            credentials={credentials}
          />

          <div className="bg-white rounded-xl shadow-lg border-0 backdrop-blur-sm">
            <Tabs defaultValue="overview" className="space-y-6">
              <WhatsAppTabsList 
                messages={messages}
                allowlist={allowlist}
                logStats={logStats}
              />

              <div className="p-4 sm:p-6">
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <TabsContent value="overview" className="space-y-6 mt-0">
                      <WhatsAppOverview />
                    </TabsContent>

                    <TabsContent value="messages" className="mt-0">
                      <WhatsAppMessagesManager />
                    </TabsContent>

                    <TabsContent value="allowlist" className="mt-0">
                      <WhatsAppAllowlistManager />
                    </TabsContent>

                    <TabsContent value="templates" className="mt-0">
                      <MessageTemplates />
                    </TabsContent>

                    <TabsContent value="automation" className="mt-0">
                      <AutomationDashboard />
                    </TabsContent>

                    <TabsContent value="config" className="mt-0">
                      <WhatsAppConfig />
                    </TabsContent>

                    <TabsContent value="health" className="mt-0">
                      <WhatsAppHealthDashboard />
                    </TabsContent>

                    <TabsContent value="debug" className="mt-0">
                      <WhatsAppDebugPanel />
                    </TabsContent>

                    <TabsContent value="logs" className="mt-0">
                      <WhatsAppLogs />
                    </TabsContent>
                  </Suspense>
                </ErrorBoundary>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default memo(WhatsApp);
