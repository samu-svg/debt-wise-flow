
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Home, 
  Plus, 
  X, 
  FileText,
  MessageSquare 
} from 'lucide-react';

const PrivateLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { title: 'Dashboard', path: '/app', icon: Home },
    { title: 'Clientes', path: '/app/clients', icon: Plus },
    { title: 'Dívidas', path: '/app/debts', icon: Calendar },
    { title: 'Relatórios', path: '/app/reports', icon: FileText },
    { title: 'WhatsApp', path: '/app/whatsapp', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Debt Manager Pro
          </h2>
          <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  isActive(item.path) ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center justify-center"
          >
            <X className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            Sistema de Gerenciamento de Dívidas
          </h1>
        </header>
        
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PrivateLayout;
