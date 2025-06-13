
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Debt Manager Pro Plus
            </h1>
            <p className="text-gray-600">
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
