
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EnhancedCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

const EnhancedCard = ({ 
  title, 
  description, 
  children, 
  className = "",
  hoverable = true,
  onClick
}: EnhancedCardProps) => {
  const hoverClasses = hoverable 
    ? "hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer" 
    : "";

  return (
    <Card 
      className={`bg-white border-[#DEE2E6] shadow-sm ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {(title || description) && (
        <CardHeader className="pb-3">
          {title && (
            <CardTitle className="text-lg text-[#343A40] font-semibold">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-[#6C757D]">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

export default EnhancedCard;
