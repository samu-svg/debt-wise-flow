
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
    soft: 'badge-info'
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
    solid: 'bg-[#08872B]',
    outline: 'border-[#08872B] text-[#08872B]'
  },
  warning: {
    solid: 'bg-[#6C757D]',
    outline: 'border-[#6C757D] text-[#6C757D]'
  },
  danger: {
    solid: 'bg-[#DC3545]',
    outline: 'border-[#DC3545] text-[#DC3545]'
  },
  info: {
    solid: 'bg-[#6C757D]',
    outline: 'border-[#6C757D] text-[#6C757D]'
  },
  neutral: {
    solid: 'bg-[#6C757D]',
    outline: 'border-[#6C757D] text-[#6C757D]'
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
      variant === 'solid' && statusColors[status].solid,
      variant === 'outline' && statusColors[status].outline,
      sizeClasses[size],
      className
    )}>
      {children}
    </span>
  );
};

export default StatusBadge;
