
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

// Layouts
import PrivateLayout from '@/components/layouts/PrivateLayout';
import PublicLayout from '@/components/layouts/PublicLayout';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// App pages
import Dashboard from '@/pages/app/Dashboard';
import Clients from '@/pages/app/Clients';
import Debts from '@/pages/app/Debts';
import WhatsApp from '@/pages/app/WhatsApp';
import Reports from '@/pages/app/Reports';

// Other pages
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';
import AppInitializationProvider from '@/components/AppInitializationProvider';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppInitializationProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Index />} />
                <Route path="login" element={<Login />} />
                <Route path="entrar" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="registre-se" element={<Register />} />
                <Route path="cadastro" element={<Register />} />
              </Route>

              {/* Private routes */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <PrivateLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="clients" element={<Clients />} />
                <Route path="debts" element={<Debts />} />
                <Route path="whatsapp" element={<WhatsApp />} />
                <Route path="reports" element={<Reports />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AppInitializationProvider>
      </Router>
      <Toaster />
      <Sonner />
    </QueryClientProvider>
  );
}

export default App;
