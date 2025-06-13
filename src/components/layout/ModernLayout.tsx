
import { Outlet } from 'react-router-dom';
import ModernSidebar from './ModernSidebar';
import { useState } from 'react';

const ModernLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ModernSidebar />
      
      {/* Main content */}
      <div className="ml-64 transition-all duration-300">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ModernLayout;
