import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Layouts
import PublicLayout from "@/components/layouts/PublicLayout";
import ModernLayout from "@/components/layout/ModernLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// App Pages
import ModernDashboard from "@/pages/app/ModernDashboard";
import ModernClients from "@/pages/app/ModernClients";
import ModernWhatsApp from "@/pages/app/ModernWhatsApp";
import ModernSettings from "@/pages/app/ModernSettings";

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
                <ModernLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ModernDashboard />} />
              <Route path="clients" element={<ModernClients />} />
              <Route path="whatsapp" element={<ModernWhatsApp />} />
              <Route path="settings" element={<ModernSettings />} />
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
