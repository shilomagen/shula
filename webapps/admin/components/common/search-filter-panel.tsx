'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import he from '@/locales/he';
import { Filter, RefreshCw, Search } from 'lucide-react';
import { ReactNode, useState } from 'react';

export interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'custom';
  placeholder?: string;
  value: any;
  onChange: (value: any) => void;
  options?: { label: string; value: string | number }[];
  customComponent?: ReactNode;
  inputProps?: Record<string, any>;
}

interface SearchFilterPanelProps {
  searchValue?: string;
  onSearchChange?: (value: string | undefined) => void;
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  onRefresh?: () => void;
  className?: string;
  showRefreshButton?: boolean;
  filterPanelTitle?: string;
}

export function SearchFilterPanel({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = he.common.search,
  filterOptions = [],
  onApplyFilters,
  onClearFilters,
  onRefresh,
  className = '',
  showRefreshButton = true,
  filterPanelTitle = he.common.filter,
}: SearchFilterPanelProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearch = (value: string) => {
    onSearchChange?.(value.length > 0 ? value : undefined);
  };

  const handleApplyFilters = () => {
    onApplyFilters?.();
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    onClearFilters?.();
    setIsFilterOpen(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
        <div className="flex items-center gap-3">
          {onSearchChange && (
            <div className="relative w-72">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-8 text-right"
              />
            </div>
          )}

          {filterOptions.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`${isFilterOpen ? 'bg-muted' : ''} ms-3`}
            >
              <Filter className="h-4 w-4 me-2" />
              {filterPanelTitle}
            </Button>
          )}

          {showRefreshButton && onRefresh && (
            <Button variant="outline" onClick={onRefresh} className="ms-3">
              <RefreshCw className="h-4 w-4 me-2" />
              {he.common.refresh}
            </Button>
          )}
        </div>
      </div>

      {isFilterOpen && filterOptions.length > 0 && (
        <div className="p-4 border rounded-md bg-white shadow-sm">
          <h3 className="text-sm font-medium mb-3">{filterPanelTitle}</h3>
          <div className="flex flex-wrap gap-4">
            {filterOptions.map((option) => (
              <div key={option.id} className="grid gap-1">
                <label className="text-sm font-medium">{option.label}</label>
                {option.type === 'text' && (
                  <Input
                    type="text"
                    placeholder={option.placeholder}
                    value={option.value ?? ''}
                    onChange={(e) => option.onChange(e.target.value)}
                    {...option.inputProps}
                  />
                )}
                {option.type === 'number' && (
                  <Input
                    type="number"
                    placeholder={option.placeholder}
                    className="w-24"
                    value={option.value ?? ''}
                    onChange={(e) =>
                      option.onChange(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    {...option.inputProps}
                  />
                )}
                {option.type === 'custom' && option.customComponent}
              </div>
            ))}
            <div className="flex items-end gap-3">
              <Button onClick={handleApplyFilters}>{he.common.filter}</Button>
              <Button variant="outline" onClick={handleClearFilters}>
                {he.common.clearSelection}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
