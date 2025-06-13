

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
    solid: 'bg-green-600 text-white',
    outline: 'border-green-600 text-green-600 bg-transparent',
    soft: 'badge-success'
  },
  warning: {
    solid: 'bg-white text-gray-800 border border-gray-300',
    outline: 'border-white text-gray-600 bg-transparent',
    soft: 'badge-warning'
  },
  danger: {
    solid: 'bg-red-600 text-white',
    outline: 'border-red-600 text-red-600 bg-transparent',
    soft: 'badge-danger'
  },
  info: {
    solid: 'bg-blue-600 text-white',
    outline: 'border-blue-600 text-blue-600 bg-transparent',
    soft: 'badge-info'
  },
  neutral: {
    solid: 'bg-gray-600 text-white',
    outline: 'border-gray-600 text-gray-600 bg-transparent',
    soft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
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
    <span className={cn(
      'inline-flex items-center font-medium rounded-full',
      statusClasses[status][variant],
      sizeClasses[size],
      variant === 'outline' && 'border',
      className
    )}>
      {children}
    </span>
  );
};

export default StatusBadge;

