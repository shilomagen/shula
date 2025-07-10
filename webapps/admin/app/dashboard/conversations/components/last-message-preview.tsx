'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useConversationMessages } from '@/lib/hooks/use-conversations';
import he from '@/locales/he';
import { Image } from 'lucide-react';

interface LastMessagePreviewProps {
  conversationId: string;
}

export function LastMessagePreview({
  conversationId,
}: LastMessagePreviewProps) {
  const { data: messages, isLoading } = useConversationMessages(conversationId);

  if (isLoading) {
    return <LastMessagePreviewSkeleton />;
  }

  if (!messages || messages.length === 0) {
    return (
      <span className="text-muted-foreground">
        {he.conversations.messages.noMessages}
      </span>
    );
  }

  // Get the last message
  const lastMessage = messages[messages.length - 1];

  // Handle image upload message type
  if (lastMessage.type === 'IMAGE_UPLOAD') {
    return <ImageMessagePreview />;
  }

  // Handle content
  return (
    <div className="truncate text-sm text-muted-foreground max-w-[200px]">
      {lastMessage.content || '-'}
    </div>
  );
}

function ImageMessagePreview() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Image className="h-4 w-4" />
      <span>{he.conversations.messages.imageUploaded}</span>
    </div>
  );
}

export function LastMessagePreviewSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
