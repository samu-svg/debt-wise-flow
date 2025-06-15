
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Suspense, lazy } from 'react';

// Layouts carregados imediatamente (pequenos)
import PrivateLayout from '@/components/layouts/PrivateLayout';
import PublicLayout from '@/components/layouts/PublicLayout';

// Auth pages carregados imediatamente (críticos)
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Components carregados imediatamente
import ProtectedRoute from '@/components/ProtectedRoute';
import EnhancedLoading from '@/components/ui/enhanced-loading';

// Lazy loading das páginas principais
const Dashboard = lazy(() => import('@/pages/app/Dashboard'));
const Clients = lazy(() => import('@/pages/app/Clients'));
const Debts = lazy(() => import('@/pages/app/Debts'));
const WhatsApp = lazy(() => import('@/pages/app/WhatsApp'));
const Reports = lazy(() => import('@/pages/app/Reports'));
const Index = lazy(() => import('@/pages/Index'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<EnhancedLoading />}>
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
          </Suspense>
        </div>
      </Router>
      <Toaster />
      <Sonner />
    </QueryClientProvider>
  );
}

export default App;
