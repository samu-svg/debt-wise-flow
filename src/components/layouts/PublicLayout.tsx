
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div 
      className="min-h-screen" 
      style={{ 
        background: 'linear-gradient(135deg, #F8F9FA 0%, #E5E7EB 100%)',
        backgroundColor: '#F8F9FA'
      }}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 
              className="text-4xl font-bold mb-2"
              style={{ color: '#374151' }}
            >
              Debt Manager Pro Plus
            </h1>
            <p 
              className="text-lg"
              style={{ color: '#6B7280' }}
            >
              Sistema Híbrido Completo de Gerenciamento de Dívidas
            </p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default PublicLayout;
