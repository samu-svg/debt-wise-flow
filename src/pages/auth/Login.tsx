
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Debt Manager Pro Plus",
        className: "bg-white border-green-200 text-gray-800",
      });
      navigate('/app');
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Verifique suas credenciais e tente novamente",
        variant: "destructive",
        className: "bg-red-50 border-red-200 text-red-800",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full login-container" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center login-title" style={{ color: '#374151', fontWeight: '600' }}>
          Entrar
        </CardTitle>
        <CardDescription className="text-center" style={{ color: '#6B7280' }}>
          Entre com sua conta para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="form-label" style={{ color: '#374151', fontWeight: '500' }}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                color: '#374151'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10B981';
                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="form-label" style={{ color: '#374151', fontWeight: '500' }}>
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                color: '#374151'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10B981';
                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full btn-login" 
            disabled={loading}
            style={{
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = '#10B981';
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Não tem uma conta?{' '}
            <Link 
              to="/registre-se" 
              className="register-link"
              style={{ 
                color: '#6B7280', 
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#10B981'}
              on
MouseLeave={(e) => e.target.style.color = '#6B7280'}
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Login;
