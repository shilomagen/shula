import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column';
}

const Chat = React.forwardRef<HTMLDivElement, ChatProps>(
  ({ className, direction = 'column', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex w-full flex-col gap-4',
        direction === 'row' && 'flex-row',
        className
      )}
      {...props}
    />
  )
);
Chat.displayName = 'Chat';

interface ChatMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  avatarSrc?: string;
  avatarFallback?: string;
  isCurrentUser?: boolean;
  timestamp?: string;
}

const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  (
    {
      className,
      name,
      avatarSrc,
      avatarFallback,
      isCurrentUser = false,
      timestamp,
      children,
      ...props
    },
    ref
  ) => {

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start gap-3',
          isCurrentUser ? 'me-4 self-end' : 'ms-4 self-start',
          className
        )}
        {...props}
      >
        {!isCurrentUser && (
          <Avatar className="h-8 w-8">
            {avatarSrc && <AvatarImage src={avatarSrc} />}
            <AvatarFallback>{avatarFallback || name[0]}</AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn('flex flex-col gap-1', isCurrentUser && 'items-end')}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-medium',
                isCurrentUser && 'order-last'
              )}
            >
              {name}
            </span>
            {timestamp && (
              <span className="text-xs text-muted-foreground">
                {timestamp}
              </span>
            )}
          </div>
          <Card
            className={cn(
              'max-w-[85%] rounded-xl px-3 py-2',
              isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            {children}
          </Card>
        </div>
        {isCurrentUser && (
          <Avatar className="h-8 w-8">
            {avatarSrc && <AvatarImage src={avatarSrc} />}
            <AvatarFallback>{avatarFallback || name[0]}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }
);
ChatMessage.displayName = 'ChatMessage';

const ChatList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-4 overflow-y-auto', className)}
    {...props}
  />
));
ChatList.displayName = 'ChatList';

const ChatInput = React.forwardRef<
  HTMLFormElement,
  React.HTMLAttributes<HTMLFormElement>
>(({ className, ...props }, ref) => (
  <form
    ref={ref}
    className={cn('flex items-center gap-2', className)}
    {...props}
  />
));
ChatInput.displayName = 'ChatInput';

export { Chat, ChatMessage, ChatList, ChatInput };
