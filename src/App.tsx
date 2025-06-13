import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Layouts
import PublicLayout from "@/components/layouts/PublicLayout";
import PrivateLayout from "@/components/layouts/PrivateLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// App Pages
import Dashboard from "@/pages/app/Dashboard";
import Clients from "@/pages/app/Clients";
import Debts from "@/pages/app/Debts";
import CobrancaAutomatica from "@/pages/app/CobrancaAutomatica";
import Reports from "@/pages/app/Reports";
import WhatsApp from "@/pages/app/WhatsApp";

// Other Pages
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Redirect root to app */}
            <Route path="/" element={<Navigate to="/app" replace />} />
            
            {/* Public Auth Routes */}
            <Route path="/auth" element={<PublicLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route index element={<Navigate to="/auth/login" replace />} />
            </Route>

            {/* Protected App Routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <PrivateLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="debts" element={<Debts />} />
              <Route path="cobranca-automatica" element={<CobrancaAutomatica />} />
              <Route path="reports" element={<Reports />} />
              <Route path="whatsapp" element={<WhatsApp />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
