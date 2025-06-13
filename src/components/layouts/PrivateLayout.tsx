
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useFileSystemBackup } from '@/hooks/useFileSystemBackup';
import { setBackupCallback } from '@/hooks/useLocalStorage';
import BackupStatus from '@/components/BackupStatus';
import BackupConfigModal from '@/components/BackupConfigModal';
import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Home, 
  Plus, 
  X, 
  FileText,
  MessageSquare,
  Moon,
  Sun,
  Menu,
  ChevronLeft
} from 'lucide-react';

const PrivateLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { createBackup } = useFileSystemBackup();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { title: 'Dashboard', path: '/app', icon: Home, color: 'text-blue-600' },
    { title: 'Clientes', path: '/app/clients', icon: Plus, color: 'text-green-600' },
    { title: 'Dívidas', path: '/app/debts', icon: Calendar, color: 'text-orange-600' },
    { title: 'Relatórios', path: '/app/reports', icon: FileText, color: 'text-purple-600' },
    { title: 'WhatsApp', path: '/app/whatsapp', icon: MessageSquare, color: 'text-emerald-600' },
  ];

  // Dark mode toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Configurar callback de backup automático
  useEffect(() => {
    setBackupCallback(async (data) => {
      await createBackup(data);
    });
  }, [createBackup]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900 flex ${darkMode ? 'dark' : ''}`}>
      {/* Modal de configuração de backup */}
      <BackupConfigModal />
      
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-72'} transition-all duration-300 ease-in-out`}>
        <div className={`fixed left-0 top-0 h-full ${sidebarCollapsed ? 'w-16' : 'w-72'} card-modern border-r-0 rounded-none z-30 transition-all duration-300`}>
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Debt Wise Flow
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {user?.email}
                  </p>
                </div>
              )}
              <Button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                variant="ghost"
                size="sm"
                className="hover-lift"
              >
                {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${active ? 'active' : ''} flex items-center group`}
                  title={sidebarCollapsed ? item.title : ''}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : item.color} transition-colors duration-200`} />
                  {!sidebarCollapsed && (
                    <span className={`ml-3 font-medium ${active ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {item.title}
                    </span>
                  )}
                  {active && !sidebarCollapsed && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="absolute bottom-6 left-4 right-4 space-y-3">
            {/* Dark Mode Toggle */}
            <Button
              onClick={toggleDarkMode}
              variant="ghost"
              className={`${sidebarCollapsed ? 'w-8 h-8 p-0' : 'w-full'} hover-lift justify-start`}
              title={sidebarCollapsed ? (darkMode ? 'Light Mode' : 'Dark Mode') : ''}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {!sidebarCollapsed && (
                <span className="ml-3">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
              )}
            </Button>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className={`${sidebarCollapsed ? 'w-8 h-8 p-0' : 'w-full'} hover-lift justify-start border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20`}
              title={sidebarCollapsed ? 'Sair' : ''}
            >
              <X className="w-4 h-4" />
              {!sidebarCollapsed && <span className="ml-3">Sair</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="card-modern border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sistema de Gerenciamento de Dívidas
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gestão inteligente e profissional
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <BackupStatus />
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PrivateLayout;
