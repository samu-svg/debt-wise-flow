
import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'soft';
}

const statusClasses = {
  success: {
    solid: 'text-white',
    outline: 'border-2 bg-transparent',
    soft: 'badge-success'
  },
  warning: {
    solid: 'text-white',
    outline: 'border-2 bg-transparent',
    soft: 'badge-info' /* FORÇADO: Usar badge-info em vez de warning */
  },
  danger: {
    solid: 'text-white',
    outline: 'border-2 bg-transparent',
    soft: 'badge-danger'
  },
  info: {
    solid: 'text-white',
    outline: 'border-2 bg-transparent',
    soft: 'badge-info'
  },
  neutral: {
    solid: 'text-white',
    outline: 'border-2 bg-transparent',
    soft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
};

const statusColors = {
  success: {
    solid: 'bg-[#10B981]', /* FORÇADO: Verde suave */
    outline: 'border-[#10B981] text-[#10B981]'
  },
  warning: {
    solid: 'bg-[#6B7280]', /* FORÇADO: Cinza médio em vez de amarelo */
    outline: 'border-[#6B7280] text-[#6B7280]'
  },
  danger: {
    solid: 'bg-[#EF4444]', /* FORÇADO: Vermelho suave */
    outline: 'border-[#EF4444] text-[#EF4444]'
  },
  info: {
    solid: 'bg-[#6B7280]', /* FORÇADO: Cinza médio */
    outline: 'border-[#6B7280] text-[#6B7280]'
  },
  neutral: {
    solid: 'bg-[#6B7280]',
    outline: 'border-[#6B7280] text-[#6B7280]'
  }
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base'
};

export const StatusBadge = ({ 
  status, 
  children, 
  className, 
  size = 'md',
  variant = 'soft'
}: StatusBadgeProps) => {
  return (
    <span 
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        statusClasses[status][variant],
        variant === 'solid' && statusColors[status].solid,
        variant === 'outline' && statusColors[status].outline,
        sizeClasses[size],
        className
      )}
      style={{
        /* FORÇAR CORES ESPECÍFICAS PARA GARANTIR SEM AMARELO */
        ...(status === 'warning' && {
          backgroundColor: variant === 'solid' ? '#6B7280' : 'rgb(107 114 128 / 0.1)',
          color: variant === 'solid' ? '#FFFFFF' : '#6B7280',
          borderColor: '#6B7280'
        }),
        ...(status === 'success' && {
          backgroundColor: variant === 'solid' ? '#10B981' : 'rgb(16 185 129 / 0.1)',
          color: variant === 'solid' ? '#FFFFFF' : '#10B981',
          borderColor: '#10B981'
        }),
        ...(status === 'danger' && {
          backgroundColor: variant === 'solid' ? '#EF4444' : 'rgb(239 68 68 / 0.1)',
          color: variant === 'solid' ? '#FFFFFF' : '#EF4444',
          borderColor: '#EF4444'
        }),
        ...(status === 'info' && {
          backgroundColor: variant === 'solid' ? '#6B7280' : 'rgb(107 114 128 / 0.1)',
          color: variant === 'solid' ? '#FFFFFF' : '#6B7280',
          borderColor: '#6B7280'
        })
      }}
    >
      {children}
    </span>
  );
};

export default StatusBadge;
