
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
  avatar?: boolean;
}

export const LoadingSkeleton = ({ className, rows = 3, avatar = false }: LoadingSkeletonProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {avatar && (
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full loading-skeleton"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton w-1/2"></div>
          </div>
        </div>
      )}
      
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton w-5/6"></div>
        </div>
      ))}
    </div>
  );
};

export const MetricCardSkeleton = () => {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton w-2/3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton w-1/3"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full loading-skeleton"></div>
      </div>
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="card-modern p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton w-1/2"></div>
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton"></div>
      </div>
    </div>
  );
};
