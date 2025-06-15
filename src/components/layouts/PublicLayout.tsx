
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div 
      className="min-h-screen relative overflow-hidden" 
      style={{ 
        background: 'linear-gradient(135deg, #F8F9FA 0%, #E5E7EB 50%, #F3F4F6 100%)',
        backgroundColor: '#F8F9FA'
      }}
    >
      {/* Floating elements for visual interest */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-[#08872B]/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-1/4 right-20 w-32 h-32 bg-[#059669]/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-[#10B981]/10 rounded-full blur-xl animate-pulse delay-500"></div>
      
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#08872B] to-[#059669] rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-scale-in">
                <span className="text-white text-2xl font-bold">DM</span>
              </div>
            </div>
            <h1 
              className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#343A40] to-[#6C757D] bg-clip-text text-transparent"
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
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#08872B] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#08872B] rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-[#08872B] rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
          <div className="animate-fade-in delay-300">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicLayout;
