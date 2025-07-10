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
import { ConversationResponseDto } from '@/lib/hooks/use-conversations';
import he from '@/locales/he';
import { MessageCircle, MoreHorizontal, XCircle } from 'lucide-react';
import { useState } from 'react';

interface ConversationActionMenuProps {
  conversation: ConversationResponseDto;
  onView: (id: string) => void;
  onAbandon: (id: string) => void;
}

export function ConversationActionMenu({
  conversation,
  onView,
  onAbandon,
}: ConversationActionMenuProps) {
  const handleAbandon = (id: string) => {
    onAbandon(id);
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">{he.common.openMenu}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel>{he.common.actions}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ViewConversationMenuItem
            conversationId={conversation.id}
            onView={onView}
          />

          {conversation.status !== 'abandoned' && (
            <AbandonConversationMenuItem
              conversationId={conversation.id}
              onAbandon={handleAbandon}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface ViewConversationMenuItemProps {
  conversationId: string;
  onView: (id: string) => void;
}

function ViewConversationMenuItem({
  conversationId,
  onView,
}: ViewConversationMenuItemProps) {
  return (
    <DropdownMenuItem
      onClick={(e) => {
        e.stopPropagation();
        onView(conversationId);
      }}
    >
      <MessageCircle className="ml-2 h-4 w-4" />
      {he.conversations.actions.view}
    </DropdownMenuItem>
  );
}

interface AbandonConversationMenuItemProps {
  conversationId: string;
  onAbandon: (id: string) => void;
}

function AbandonConversationMenuItem({
  conversationId,
  onAbandon,
}: AbandonConversationMenuItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDialogOpen(false);
  };

  const handleAbandon = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAbandon(conversationId);
    setIsDialogOpen(false);
  };

  return (
    <AlertDialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
      }}
    >
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onClick={handleOpenDialog}
          onSelect={(e) => {
            // Prevent the dropdown from closing when clicking the menu item
            e.preventDefault();
          }}
        >
          <XCircle className="ml-2 h-4 w-4" />
          {he.conversations.actions.abandon}
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent
        onClick={(e) => e.stopPropagation()}
        className="max-w-md border-2 border-red-100 bg-white shadow-lg"
        dir="rtl"
      >
        <AlertDialogHeader className="text-right">
          <AlertDialogTitle className="text-lg font-bold text-red-600">
            {he.conversations.confirmAbandon.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 mt-2">
            {he.conversations.confirmAbandon.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-start gap-3 mt-6">
          <AlertDialogAction
            onClick={(e) => handleAbandon(e)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            {he.conversations.confirmAbandon.confirm}
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={(e) => handleCloseDialog(e)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition-colors border border-gray-300"
          >
            {he.conversations.confirmAbandon.cancel}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
