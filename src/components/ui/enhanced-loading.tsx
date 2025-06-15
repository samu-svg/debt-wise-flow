
import React from 'react';

interface EnhancedLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EnhancedLoading = ({ 
  text = "Carregando...", 
  size = 'md',
  className = "" 
}: EnhancedLoadingProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-[#08872B] rounded-full animate-spin`}></div>
        <div className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent border-l-[#08872B]/30 rounded-full animate-pulse`}></div>
      </div>
      <p className={`${textSizeClasses[size]} text-[#6C757D] font-medium animate-pulse`}>
        {text}
      </p>
    </div>
  );
};

export default EnhancedLoading;
