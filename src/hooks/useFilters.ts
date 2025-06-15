
import { useState, useMemo, useCallback } from 'react';

interface UseFiltersProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  filterFunctions?: Record<string, (item: T, filterValue: string) => boolean>;
}

export const useFilters = <T>({ data, searchFields, filterFunctions = {} }: UseFiltersProps<T>) => {
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filteredData = useMemo(() => {
    let result = data;

    // Aplicar busca por texto
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower);
          }
          if (typeof value === 'number') {
            return value.toString().includes(searchLower);
          }
          return false;
        })
      );
    }

    // Aplicar filtros customizados
    Object.entries(filters).forEach(([filterKey, filterValue]) => {
      if (filterValue && filterValue !== 'all' && filterFunctions[filterKey]) {
        result = result.filter(item => filterFunctions[filterKey](item, filterValue));
      }
    });

    return result;
  }, [data, searchValue, filters, searchFields, filterFunctions]);

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchValue('');
    setFilters({});
  }, []);

  const hasActiveFilters = searchValue || Object.values(filters).some(value => value && value !== 'all');

  return {
    searchValue,
    setSearchValue,
    filters,
    updateFilter,
    resetFilters,
    filteredData,
    hasActiveFilters,
    resultCount: filteredData.length,
    totalCount: data.length
  };
};
