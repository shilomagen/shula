'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chat, ChatInput, ChatList, ChatMessage } from '@/components/ui/chat';
import { Input } from '@/components/ui/input';
import { MessageResponseDto, ParticipantsResponseDto } from '@/generated/http-clients/backend/models';
import { useSendMessage } from '@/lib/hooks/use-conversations';
import he from '@/locales/he';
import { format } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { Image as ImageIcon, Loader2, SendHorizonal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ConversationChatProps {
  conversationId: string;
  messages: MessageResponseDto[];
  isLoading: boolean;
  participant: ParticipantsResponseDto;
}

// Image message component
function ImageMessage() {
  return (
    <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-md border">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {he.conversations.messages.imageUploaded}
        </span>
      </div>
      <div className="rounded-md bg-muted/50 h-24 w-full flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
      </div>
    </div>
  );
}

export function ConversationChat({
  conversationId,
  messages,
  isLoading,
  participant,
}: ConversationChatProps) {
  const [messageContent, setMessageContent] = useState('');
  const chatListRef = useRef<HTMLDivElement>(null);
  const sendMessageMutation = useSendMessage();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    sendMessageMutation.mutate({
      conversationId,
      content: messageContent,
    });
    setMessageContent('');
  };

  // Function to determine if the message was sent by system or participant
  const isSystemMessage = (message: MessageResponseDto) => {
    return message.type === 'AGENT_MESSAGE' || message.type === 'SYSTEM_EVENT';
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return '';
      }
      return format(date, 'p', { locale: dateFnsHe });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <Card className="h-[70vh] flex flex-col bg-white shadow-sm">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex items-center text-xl font-medium">
          <SendHorizonal className="ml-2 h-5 w-5 text-primary" />
          {he.conversations.chat.title} {participant.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        <ChatList
          ref={chatListRef}
          className="flex-1 p-4 space-y-4 overflow-y-auto"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              {he.conversations.chat.noMessages}
            </div>
          ) : (
            <Chat>
              {messages.map((message) => {
                const isSystem = isSystemMessage(message);

                return (
                  <ChatMessage
                    key={message.id}
                    name={
                      isSystem
                        ? he.conversations.chat.system
                        : participant.name || he.conversations.chat.participant
                    }
                    isCurrentUser={isSystem}
                    timestamp={formatMessageTime(message.timestamp)}
                    avatarSrc={isSystem ? '/shula.png' : undefined}
                    avatarFallback={isSystem ? 'S' : 'P'}
                  >
                    <div className="flex gap-2 items-start">
                      <div className="flex-grow">
                        {message.type === 'IMAGE_UPLOAD' ? (
                          <ImageMessage />
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  </ChatMessage>
                );
              })}
            </Chat>
          )}
        </ChatList>

        <ChatInput
          onSubmit={handleSendMessage}
          className="p-4 border-t flex gap-2 bg-card"
        >
          <Input
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={he.conversations.chat.messagePlaceholder}
            className="flex-1"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!messageContent.trim() || sendMessageMutation.isPending}
            className="px-4 flex flex-row-reverse"
          >
            {he.conversations.chat.sendMessage}
            {sendMessageMutation.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <SendHorizonal className="mr-1 h-4 w-4" />
            )}
          </Button>
        </ChatInput>
      </CardContent>
    </Card>
  );
}
