
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import SearchInput from './SearchInput';
import FilterSelect from './FilterSelect';

interface FilterOption {
  value: string;
  label: string;
}

interface FiltersBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
  }[];
  onReset?: () => void;
  className?: string;
}

const FiltersBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters = [],
  onReset,
  className = ""
}: FiltersBarProps) => {
  const hasActiveFilters = searchValue || filters.some(filter => filter.value && filter.value !== 'all');

  return (
    <div className={`flex flex-col md:flex-row gap-4 p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-[#DEE2E6] shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex-1">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      </div>
      
      <div className="flex flex-wrap gap-3 items-center">
        {filters.map((filter, index) => (
          <FilterSelect
            key={index}
            value={filter.value}
            onChange={filter.onChange}
            options={filter.options}
            placeholder={filter.placeholder}
          />
        ))}
        
        {hasActiveFilters && onReset && (
          <Button
            variant="outline"
            onClick={onReset}
            className="border-[#DEE2E6] text-[#6C757D] hover:bg-[#F8F9FA] hover:border-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
};

export default FiltersBar;
