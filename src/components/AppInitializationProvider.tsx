
import React from 'react';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useAuth } from '@/hooks/useAuth';
import AppInitializationModal from './AppInitializationModal';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Database } from 'lucide-react';

interface AppInitializationProviderProps {
  children: React.ReactNode;
}

const AppInitializationProvider = ({ children }: AppInitializationProviderProps) => {
  const { user, loading: authLoading } = useAuth();
  const { 
    isInitializing, 
    isReady, 
    needsConfiguration,
    configError 
  } = useAppInitialization();

  // Mostrar loading enquanto autenticação carrega
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg font-medium">Carregando autenticação...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não há usuário logado, mostrar children (página de login)
  if (!user) {
    return <>{children}</>;
  }

  // Mostrar loading durante inicialização da aplicação
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <Database className="w-6 h-6 animate-pulse text-blue-600" />
              <span className="text-lg font-medium">Inicializando aplicação...</span>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Verificando configurações e reconectando dados locais
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se há erro na configuração ou precisa de configuração, mostrar modal
  if (needsConfiguration || configError) {
    return (
      <>
        {children}
        <AppInitializationModal />
      </>
    );
  }

  // Se está pronto, mostrar aplicação normalmente
  if (isReady) {
    return <>{children}</>;
  }

  // Fallback para estado indefinido
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-96">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-600" />
            <span className="text-lg font-medium">Preparando aplicação...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppInitializationProvider;
