'use client';

import he from '@/locales/he';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { deleteSystemMessage } from '../actions';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SystemMessageResponseDto } from '@/generated/http-clients/backend';

interface DeleteMessageDialogProps {
  children?: ReactNode;
  message: SystemMessageResponseDto;
  trigger: (props: { onClick: () => void }) => ReactNode;
}

export function DeleteMessageDialog({
  children,
  message,
  trigger,
}: DeleteMessageDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return deleteSystemMessage(message.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemMessages'] });
      toast.success(he.systemMessages.notifications.deleted);
      setOpen(false);
    },
    onError: () => {
      toast.error(he.systemMessages.errors.deleteError);
    },
  });

  const handleOpenDialog = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpen(true);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    deleteMutation.mutate();
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpen(false);
  };

  return (
    <>
      {trigger({ onClick: handleOpenDialog })}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {he.systemMessages.dialogs.delete.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {he.systemMessages.dialogs.delete.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {he.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? he.common.loading : he.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
