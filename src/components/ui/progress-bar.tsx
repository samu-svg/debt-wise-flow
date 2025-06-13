import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'red' | 'white' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  red: 'from-red-500 to-red-600',
  white: 'from-white to-gray-100 border border-gray-300 shadow-sm',
  purple: 'from-purple-500 to-purple-600',
};

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export const ProgressBar = ({ 
  value, 
  max, 
  className, 
  showLabel = false, 
  color = 'blue',
  size = 'md'
}: ProgressBarProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Progresso</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {value}/{max} ({percentage.toFixed(1)}%)
          </span>
        </div>
      )}
      <div className={cn("progress-bar", sizeClasses[size])}>
        <div 
          className={cn("progress-fill bg-gradient-to-r", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
