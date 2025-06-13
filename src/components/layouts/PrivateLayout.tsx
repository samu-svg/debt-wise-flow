import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';
import { setSaveToFolderCallback } from '@/hooks/useLocalStorage';
import { 
  Home, 
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import BackupStatus from '@/components/BackupStatus';
import BackupConfigModal from '@/components/BackupConfigModal';

const PrivateLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isConfigured, loading, saveData } = useFileSystemBackup();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const menuItems = [
    { path: '/app', icon: Home, label: 'Dashboard' },
    { path: '/app/clients', icon: Users, label: 'Clientes' },
    { path: '/app/debts', icon: FileText, label: 'Dívidas' },
    { path: '/app/reports', icon: BarChart3, label: 'Relatórios' },
    { path: '/app/whatsapp', icon: MessageSquare, label: 'WhatsApp' },
  ];

  // Configurar callback para salvamento automático na pasta
  useEffect(() => {
    if (isConfigured && saveData) {
      setSaveToFolderCallback(async (data) => {
        try {
          const filename = `dados_${new Date().toISOString().split('T')[0]}.json`;
          await saveData(JSON.stringify(data, null, 2), filename);
          console.log('Dados salvos na pasta local automaticamente');
        } catch (error) {
          console.error('Erro ao salvar dados na pasta:', error);
        }
      });
    }
  }, [isConfigured, saveData]);

  // Verificar se precisa mostrar modal de configuração
  useEffect(() => {
    // Só mostrar modal se não está carregando, não está configurado e o usuário não tem pasta configurada
    if (!loading && !isConfigured && user && !user.folderConfigured) {
      setShowConfigModal(true);
    }
  }, [loading, isConfigured, user]);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const handleConfigured = () => {
    setShowConfigModal(false);
  };

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(path);
  };

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se modal de configuração está aberto, mostrar modal
  if (showConfigModal) {
    return <BackupConfigModal open={showConfigModal} onConfigured={handleConfigured} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 z-40 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">Debt Wise</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                        ${isActive(item.path)
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <IconComponent className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-3">
            <BackupStatus />
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-gray-700"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default PrivateLayout;
