
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/app/Dashboard";
import Clientes from "./pages/app/Clientes";
import Dividas from "./pages/app/Dividas";
import Cobranca from "./pages/app/Cobranca";
import Backup from "./pages/app/Backup";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <Login />} 
            />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />}
            />
            <Route
              path="/clientes"
              element={user ? <Layout><Clientes /></Layout> : <Navigate to="/login" />}
            />
            <Route
              path="/dividas"
              element={user ? <Layout><Dividas /></Layout> : <Navigate to="/login" />}
            />
            <Route
              path="/cobranca"
              element={user ? <Layout><Cobranca /></Layout> : <Navigate to="/login" />}
            />
            <Route
              path="/backup"
              element={user ? <Layout><Backup /></Layout> : <Navigate to="/login" />}
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
