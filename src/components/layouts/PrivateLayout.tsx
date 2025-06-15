
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import BackupStatus from '@/components/BackupStatus';
import DataIntegrityChecker from '@/components/DataIntegrityChecker';
import NotificationCenter from '@/components/NotificationCenter';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  MessageSquare, 
  BarChart, 
  Settings,
  LogOut,
  Shield,
  AlertTriangle 
} from 'lucide-react';
import { useState } from 'react';

const PrivateLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const { needsAttention, stats } = useDataIntegrity();
  const [showIntegrityPanel, setShowIntegrityPanel] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
    { name: 'Clientes', href: '/app/clients', icon: Users },
    { name: 'Dívidas', href: '/app/debts', icon: Receipt },
    { name: 'WhatsApp', href: '/app/whatsapp', icon: MessageSquare },
    { name: 'Relatórios', href: '/app/reports', icon: BarChart },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-[#DEE2E6]">
        <div className="flex h-16 items-center justify-center border-b border-[#DEE2E6]">
          <h1 className="text-xl font-bold text-[#343A40]">Debt Manager</h1>
        </div>
        
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[#08872B] text-white shadow-lg'
                        : 'text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#343A40]'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-4">
          {/* Status de Integridade */}
          <Button
            onClick={() => setShowIntegrityPanel(!showIntegrityPanel)}
            variant="ghost"
            size="sm"
            className={`w-full flex items-center gap-2 px-3 ${
              needsAttention ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                needsAttention ? 'bg-red-500 animate-pulse' : 'bg-green-500'
              }`} />
              {needsAttention ? <AlertTriangle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            </div>
            <span className="text-xs">
              {needsAttention ? 'Atenção Necessária' : 'Dados Íntegros'}
            </span>
            {stats && stats.totalIssues > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.totalIssues}
              </span>
            )}
          </Button>

          <BackupStatus />
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full flex items-center justify-center border-[#DEE2E6] text-[#6C757D] hover:bg-[#F8F9FA]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Header com Centro de Notificações */}
        <header className="bg-white border-b border-[#DEE2E6] px-8 py-4">
          <div className="flex items-center justify-end">
            <NotificationCenter />
          </div>
        </header>

        {/* Painel de Integridade (Flutuante) */}
        {showIntegrityPanel && (
          <div className="fixed top-4 right-4 w-96 z-40">
            <div className="bg-white rounded-lg shadow-xl border p-1">
              <div className="flex justify-between items-center p-3 border-b">
                <h3 className="font-medium">Integridade dos Dados</h3>
                <Button
                  onClick={() => setShowIntegrityPanel(false)}
                  variant="ghost"
                  size="sm"
                >
                  ×
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <DataIntegrityChecker />
              </div>
            </div>
          </div>
        )}

        <main className="py-8 px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PrivateLayout;
