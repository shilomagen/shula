'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import he from '@/locales/he';
import Link from 'next/link';
import { format } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import {
  InfoIcon,
  MessageSquare,
  Search,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { useConversationsByParticipant } from '@/lib/hooks/use-conversations';
import { ConversationResponseDto } from '@/generated/http-clients/backend/models';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ParticipantConversationsSectionProps {
  participantId?: string;
}

// Component to display conversation status with appropriate styling
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="bg-green-500">
          {he.conversations.status.active}
        </Badge>
      );
    case 'inactive':
      return (
        <Badge variant="secondary" className="bg-yellow-500 text-black">
          {he.conversations.status.inactive}
        </Badge>
      );
    case 'abandoned':
      return (
        <Badge variant="destructive" className="bg-red-500">
          {he.conversations.status.abandoned}
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-500">
          {he.conversations.status.completed}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ParticipantConversationsSection({
  participantId,
}: ParticipantConversationsSectionProps) {
  const params = useParams();
  // If participantId is not passed from props, get it from the URL params
  const id = participantId || (params?.id as string);

  const { data: conversations = [], isLoading } =
    useConversationsByParticipant(id);

  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query (on ID since it's what we have)
  const filteredConversations = conversations.filter((conv) =>
    conv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="overflow-hidden border-2 border-muted/20">
      <CardHeader className="bg-muted/10 flex flex-row items-center justify-between">
        <CardTitle>{he.participants.conversations.title}</CardTitle>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="ghost" size="icon">
              <InfoIcon className="h-4 w-4" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">
                {he.participants.conversations.title}
              </h4>
              <p className="text-sm">
                {he.participants.conversations.noConversationsDescription}
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {conversations.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={he.common.search}
                  className="pl-3 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 rounded-lg border-2 border-dashed border-muted">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium">
                  {conversations.length === 0
                    ? he.participants.conversations.noConversations
                    : he.common.noData}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  {conversations.length === 0
                    ? he.participants.conversations.noConversationsDescription
                    : he.common.tryAgain}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredConversations.map(
                  (conversation: ConversationResponseDto) => (
                    <Card
                      key={conversation.id}
                      className={cn(
                        'overflow-hidden transition-all hover:border-primary/50',
                        conversation.status === 'active'
                          ? 'border-green-200'
                          : conversation.status === 'completed'
                          ? 'border-blue-200'
                          : conversation.status === 'abandoned'
                          ? 'border-red-200'
                          : ''
                      )}
                    >
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-lg font-mono">
                              {conversation.id.substring(0, 8)}...
                            </h3>
                            <StatusBadge status={conversation.status} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <span className="text-muted-foreground block">
                                  {he.conversations.fields.startedAt}:
                                </span>
                                <span>
                                  {conversation.startedAt
                                    ? format(
                                        new Date(conversation.startedAt),
                                        'PPP',
                                        {
                                          locale: dateFnsHe,
                                        }
                                      )
                                    : '-'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <span className="text-muted-foreground block">
                                  {he.conversations.fields.lastMessageAt}:
                                </span>
                                <span>
                                  {conversation.lastMessageAt
                                    ? format(
                                        new Date(conversation.lastMessageAt),
                                        'PPP',
                                        {
                                          locale: dateFnsHe,
                                        }
                                      )
                                    : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t px-4 py-2 bg-muted/10 flex justify-end">
                          <Link
                            href={`/dashboard/conversations/${conversation.id}`}
                            className="text-primary hover:underline flex items-center text-sm font-medium"
                          >
                            {he.conversations.actions.view}
                            <ChevronLeft className="h-4 w-4 ms-1" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
