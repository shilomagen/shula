'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import he from '@/locales/he';
import { RefreshCw, Search } from 'lucide-react';

interface SearchFiltersProps {
  onNameFilterChange: (value: string) => void;
  onPhoneFilterChange: (value: string) => void;
  onRefresh: () => void;
}

export function SearchFilters({
  onNameFilterChange,
  onPhoneFilterChange,
  onRefresh,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
        <SearchInput
          placeholder={he.conversations.search.byName}
          onChange={onNameFilterChange}
        />
        <SearchInput
          placeholder={he.conversations.search.byPhone}
          onChange={onPhoneFilterChange}
        />
      </div>
      <RefreshButton onClick={onRefresh} />
    </div>
  );
}

interface SearchInputProps {
  placeholder: string;
  onChange: (value: string) => void;
}

function SearchInput({ placeholder, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="ps-8"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

interface RefreshButtonProps {
  onClick: () => void;
}

function RefreshButton({ onClick }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="whitespace-nowrap h-9"
    >
      <RefreshCw className="ml-1 h-4 w-4" />
      {he.common.refresh}
    </Button>
  );
}
