'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import he from '@/locales/he';
import { Filter, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';

interface SearchFiltersProps {
  searchName: string | undefined;
  minParticipants: number | undefined;
  maxParticipants: number | undefined;
  onSearchChange: (value: string | undefined) => void;
  onMinParticipantsChange: (value: number | undefined) => void;
  onMaxParticipantsChange: (value: number | undefined) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  className?: string;
}

export function SearchFilters({
  searchName,
  minParticipants,
  maxParticipants,
  onSearchChange,
  onMinParticipantsChange,
  onMaxParticipantsChange,
  onApplyFilters,
  onClearFilters,
  onRefresh,
  className = '',
}: SearchFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearch = (value: string) => {
    onSearchChange(value.length > 0 ? value : undefined);
  };

  const handleApplyFilters = () => {
    onApplyFilters();
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    onClearFilters();
    setIsFilterOpen(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={he.groups.search.placeholder}
              value={searchName ?? ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-8 text-right"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`${isFilterOpen ? 'bg-muted' : ''} ms-3`}
          >
            <Filter className="h-4 w-4 me-2" />
            {he.common.filter}
          </Button>
          <Button variant="outline" onClick={onRefresh} className="ms-3">
            <RefreshCw className="h-4 w-4 me-2" />
            {he.common.refresh}
          </Button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="p-4 border rounded-md bg-white shadow-sm">
          <h3 className="text-sm font-medium mb-3">{he.common.filter}</h3>
          <div className="flex flex-wrap gap-4">
            <div className="grid gap-1">
              <label className="text-sm font-medium">
                {he.groups.fields.participantsCount} (מינימום)
              </label>
              <Input
                type="number"
                placeholder="מינימום"
                className="w-24"
                value={minParticipants ?? ''}
                onChange={(e) =>
                  onMinParticipantsChange(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">
                {he.groups.fields.participantsCount} (מקסימום)
              </label>
              <Input
                type="number"
                placeholder="מקסימום"
                className="w-24"
                value={maxParticipants ?? ''}
                onChange={(e) =>
                  onMaxParticipantsChange(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </div>
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
