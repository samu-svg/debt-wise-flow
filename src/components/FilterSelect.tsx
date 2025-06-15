
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
}

const FilterSelect = ({ value, onChange, options, placeholder = "Filtrar...", className = "" }: FilterSelectProps) => {
  return (
    <div className={`relative ${className}`}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-white border-[#DEE2E6] text-[#343A40] min-w-[150px] hover:border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-[#08872B]/20">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white border-[#DEE2E6] z-50 shadow-lg">
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value} 
              className="text-[#343A40] hover:bg-gray-50 focus:bg-gray-50 transition-colors duration-150"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FilterSelect;
