
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold text-blue-600">
              Sistema
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/dashboard">
              <Button 
                variant={isActive('/dashboard') ? 'default' : 'ghost'}
                className="text-sm"
              >
                Dashboard
              </Button>
            </Link>
            
            <Link to="/clientes">
              <Button 
                variant={isActive('/clientes') ? 'default' : 'ghost'}
                className="text-sm"
              >
                Clientes
              </Button>
            </Link>
            
            <Link to="/dividas">
              <Button 
                variant={isActive('/dividas') ? 'default' : 'ghost'}
                className="text-sm"
              >
                Dívidas
              </Button>
            </Link>
            
            <Link to="/cobranca">
              <Button 
                variant={isActive('/cobranca') ? 'default' : 'ghost'}
                className="text-sm"
              >
                Cobrança
              </Button>
            </Link>
            
            <Link to="/backup">
              <Button 
                variant={isActive('/backup') ? 'default' : 'ghost'}
                className="text-sm"
              >
                Backup
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Conta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="flex flex-col space-y-2">
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Button 
                  variant={isActive('/dashboard') ? 'default' : 'ghost'}
                  className="w-full justify-start text-sm"
                >
                  Dashboard
                </Button>
              </Link>
              
              <Link to="/clientes" onClick={() => setIsMobileMenuOpen(false)}>
                <Button 
                  variant={isActive('/clientes') ? 'default' : 'ghost'}
                  className="w-full justify-start text-sm"
                >
                  Clientes
                </Button>
              </Link>
              
              <Link to="/dividas" onClick={() => setIsMobileMenuOpen(false)}>
                <Button 
                  variant={isActive('/dividas') ? 'default' : 'ghost'}
                  className="w-full justify-start text-sm"
                >
                  Dívidas
                </Button>
              </Link>
              
              <Link to="/cobranca" onClick={() => setIsMobileMenuOpen(false)}>
                <Button 
                  variant={isActive('/cobranca') ? 'default' : 'ghost'}
                  className="w-full justify-start text-sm"
                >
                  Cobrança
                </Button>
              </Link>
              
              <Link to="/backup" onClick={() => setIsMobileMenuOpen(false)}>
                <Button 
                  variant={isActive('/backup') ? 'default' : 'ghost'}
                  className="w-full justify-start text-sm"
                >
                  Backup
                </Button>
              </Link>

              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="w-full justify-start text-sm text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
