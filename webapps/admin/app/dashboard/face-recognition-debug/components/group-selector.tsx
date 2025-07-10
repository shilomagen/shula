'use client';

import { useGroups } from '@/lib/hooks/use-face-recognition';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import he from '@/locales/he';
import { GroupSelectorProps, Group } from '../types';

const GroupSelector = ({
  onGroupSelect,
  disabled = false,
}: GroupSelectorProps) => {
  const translations = he.faceRecognitionDebug;
  const { groups, isLoading, error } = useGroups();

  return (
    <div className="space-y-2">
      <Label htmlFor="group-select">{translations.groupSelector.label}</Label>
      <Select
        onValueChange={(value) => {
          if (value) {
            onGroupSelect(value);
          }
        }}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id="group-select" className="w-full">
          <SelectValue placeholder={translations.groupSelector.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {!groups || groups.length === 0 ? (
            <div className="p-2 text-center text-muted-foreground">
              {translations.groupSelector.nothingFound}
            </div>
          ) : (
            groups.map((group: Group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name || translations.unknownGroup}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm text-destructive mt-1">
          {typeof error === 'string' ? error : 'Error loading groups'}
        </p>
      )}
    </div>
  );
};

export default GroupSelector;
