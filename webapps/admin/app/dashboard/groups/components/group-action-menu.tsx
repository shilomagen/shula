'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GroupsResponseDto } from '@/generated/http-clients/backend';
import he from '@/locales/he';
import { MoreHorizontal } from 'lucide-react';
import { IdCopyButton } from './id-copy-button';

interface GroupActionMenuProps {
  group: GroupsResponseDto;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function GroupActionMenu({
  group,
  onActivate,
  onDeactivate,
  onDelete,
  className = '',
}: GroupActionMenuProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`flex justify-end ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">{he.common.actions}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{he.common.actions}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(group.id);
            }}
          >
            {he.common.copyId}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(group.whatsappGroupId);
            }}
          >
            {he.common.copyId} WhatsApp
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {group.status === 'active' ? (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDeactivate(group.id);
              }}
            >
              {he.groups.actions.deactivate}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onActivate(group.id);
              }}
            >
              {he.groups.actions.activate}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                className="text-red-600"
                onSelect={(e) => e.preventDefault()} // Prevent closing dropdown when opening alert
                onClick={(e) => e.stopPropagation()}
              >
                {he.groups.actions.delete}
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{he.common.error}</AlertDialogTitle>
                <AlertDialogDescription>
                  {`${he.common.delete} "${group.name}"`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{he.common.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(group.id);
                  }}
                >
                  {he.common.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
