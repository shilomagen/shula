'use client';

import he from '@/locales/he';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  Calendar,
  MessageCircle,
  User,
  Clock,
  Phone,
  Users,
  Copy,
  Image,
  RefreshCw,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import {
  useConversation,
  useConversationMessages,
  useUpdateConversation,
} from '@/lib/hooks/use-conversations';
import {
  useParticipant,
  useParticipantContext,
} from '@/lib/hooks/use-participants';
import { ConversationChat } from './components/conversation-chat';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';
import { MessageResponseDto } from '@/generated/http-clients/backend/models';

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge className="ms-2">{he.conversations.status.active}</Badge>;
    case 'inactive':
      return (
        <Badge variant="secondary" className="ms-2">
          {he.conversations.status.inactive}
        </Badge>
      );
    case 'abandoned':
      return (
        <Badge variant="destructive" className="ms-2">
          {he.conversations.status.abandoned}
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="ms-2">
          {he.conversations.status.completed}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="ms-2">
          {status}
        </Badge>
      );
  }
}

// Conversation info component
function ConversationInfo({
  startedAt,
  status,
  conversationType,
  lastMessageAt,
  messagesCount,
  currentNode,
}: {
  startedAt?: string;
  status: string;
  conversationType?: string;
  lastMessageAt?: string;
  messagesCount?: number;
  currentNode?: string;
}) {
  return (
    <Card className="bg-card border-2 border-muted/20 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 bg-muted/10">
        <CardTitle className="flex items-center text-xl font-medium">
          <MessageCircle className="ml-2 h-5 w-5 text-primary" />
          {he.conversations.fields.title || he.conversations.title}
          <StatusBadge status={status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {startedAt && (
          <div className="flex items-center">
            <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {he.conversations.fields.startedAt}:{' '}
            </span>
            <span className="mr-1 text-sm font-medium">
              {format(new Date(startedAt), 'PPP', { locale: dateFnsHe })}
            </span>
          </div>
        )}

        {lastMessageAt && (
          <div className="flex items-center">
            <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {he.conversations.fields.lastMessageAt}:{' '}
            </span>
            <span className="mr-1 text-sm font-medium">
              {format(new Date(lastMessageAt), 'PPP', { locale: dateFnsHe })}
            </span>
          </div>
        )}

        {messagesCount !== undefined && (
          <div className="flex items-center">
            <MessageCircle className="ml-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {he.conversations.fields.messagesCount}:{' '}
            </span>
            <span className="mr-1 text-sm font-medium">{messagesCount}</span>
          </div>
        )}

        {currentNode && (
          <div className="flex items-center">
            <RefreshCw className="ml-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {he.conversations.fields.currentNode || 'מצב נוכחי'}:{' '}
            </span>
            <span className="mr-1 text-sm font-medium">{currentNode}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Reset Node Button component
function ResetNodeButton({ conversationId }: { conversationId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: updateConversation } = useUpdateConversation();

  const handleResetNode = async () => {
    setIsLoading(true);
    try {
      await updateConversation({
        id: conversationId,
        data: { currentNode: 'dissambiguate_intent' },
      });
      toast.success('מצב השיחה אופס בהצלחה');
    } catch (error) {
      console.error('Failed to reset conversation node:', error);
      toast.error('שגיאה באיפוס מצב השיחה');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full mt-2"
      onClick={handleResetNode}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="ml-2 h-4 w-4" />
      )}
      {he.conversations.actions?.resetNode || 'אפס מצב שיחה'}
    </Button>
  );
}

// Photos from conversation component
function PhotosFromConversation({
  messages,
}: {
  messages: MessageResponseDto[];
}) {
  const photoMessages =
    messages?.filter(
      (message) => message.type === 'IMAGE_UPLOAD' && message.photoId
    ) || [];
  const photoIds = photoMessages.map((message) => message.photoId);

  const handleCopyPhotoIds = () => {
    const idsList = photoIds.join('\n');
    navigator.clipboard.writeText(idsList);
    toast.success('הועתק ללוח');
  };

  if (photoIds.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-2 border-muted/20 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 bg-muted/10">
        <CardTitle className="flex items-center text-xl font-medium">
          <Image className="ml-2 h-5 w-5 text-primary" />
          {'מזהי תמונות'} ({photoIds.length})
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={handleCopyPhotoIds}
            title={'העתק ללוח'}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        <div className="bg-muted/10 p-3 rounded-md text-sm font-mono max-h-40 overflow-y-auto">
          {photoIds.map((id, index) => (
            <div
              key={index}
              className="flex items-center gap-2 py-1 border-b border-dashed border-muted last:border-0"
            >
              <span className="truncate">{id}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Participant groups component
function ParticipantGroups({ participantId }: { participantId: string }) {
  const { data: context, isLoading } = useParticipantContext(participantId);

  const handleCopyGroupId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('הועתק ללוח');
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-2 border-muted/20 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 bg-muted/10">
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!context?.groups || context.groups.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-2 border-muted/20 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 bg-muted/10">
        <CardTitle className="flex items-center text-xl font-medium">
          <Users className="ml-2 h-5 w-5 text-primary" />
          {'קבוצות'} ({context.groups.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        <div className="space-y-3">
          {context.groups.map((group) => (
            <div key={group.id} className="bg-muted/10 p-3 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{group.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleCopyGroupId(group.id)}
                  title={'העתק ללוח'}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div
                className="text-xs text-muted-foreground font-mono mb-1 truncate"
                title={group.id}
              >
                ID: {group.id}
              </div>
              {group.persons && group.persons.length > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  <span>
                    {'משתתפים'}: {group.persons.length}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {group.persons.map((person) => (
                      <Badge
                        key={person.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {person.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced participant card component
function EnhancedParticipantCard({ participantId }: { participantId: string }) {
  const { data: participant, isLoading } = useParticipant(participantId);

  if (isLoading) {
    return (
      <Card className="bg-card border-2 border-muted/20 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 bg-muted/10">
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-center">
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const initials = participant?.name
    ? participant.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'NA';

  return (
    <Card className="bg-card border-2 border-muted/20 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 bg-muted/10">
        <CardTitle className="flex items-center text-xl font-medium">
          <User className="ml-2 h-5 w-5 text-primary" />
          {he.participants.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col items-center">
          <Avatar className="h-16 w-16 bg-primary/10">
            <AvatarFallback className="text-lg font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="mt-3 text-center">
            <h3 className="text-lg font-medium">
              {participant?.name || he.conversations.participant.unknown}
            </h3>
            <p className="text-sm text-muted-foreground">
              {participant?.phoneNumber || participantId}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {he.participants.fields.status}
            </span>
            <Badge
              variant={
                participant?.status === 'active' ? 'default' : 'secondary'
              }
            >
              {participant?.status === 'active'
                ? he.participants.status.active
                : he.participants.status.inactive}
            </Badge>
          </div>

          {participant?.joinedAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {he.participants.fields.joinedAt}
              </span>
              <span className="text-sm">
                {format(new Date(participant.joinedAt), 'PPP', {
                  locale: dateFnsHe,
                })}
              </span>
            </div>
          )}
        </div>

        {participant?.id && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 flex flex-row-reverse"
            asChild
          >
            <Link href={`/dashboard/participants/${participant.id}`}>
              {he.participants.fields.viewDetails || he.common.view}
              <User className="mr-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const id = params.id as string;

  const {
    data: conversation,
    isLoading: isLoadingConversation,
    error: conversationError,
  } = useConversation(id);

  const {
    data: messages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useConversationMessages(id);

  const { data: participant, isLoading: isLoadingParticipant } = useParticipant(
    conversation?.participantId || ''
  );

  const handleBackToList = () => {
    setIsLoading(true);
    router.push('/dashboard/conversations');
  };

  const loading =
    isLoadingConversation || isLoadingMessages || isLoadingParticipant;
  const error = conversationError || messagesError;

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto py-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-red-700 font-semibold text-lg mb-2">
            {he.common.error}
          </h2>
          <p className="text-red-600">{error.message}</p>
          <Button
            onClick={handleBackToList}
            variant="outline"
            className="mt-4 flex flex-row-reverse"
          >
            {he.conversations.chat.backToList}
            <ArrowLeft className="mr-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6">
      <div className="bg-card rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">{he.conversations.title}</h1>
              {!loading && conversation && (
                <Badge variant="outline" className="ms-2 font-normal">
                  {participant?.name || conversation.participantId}
                </Badge>
              )}
            </div>
            {!loading && participant && (
              <div className="flex items-center text-muted-foreground mt-1">
                <Phone className="ml-1 mr-1.5 h-4 w-4" />
                <span>{participant.phoneNumber}</span>
              </div>
            )}
          </div>
          <Button
            onClick={handleBackToList}
            variant="outline"
            disabled={isLoading}
            className="h-9 flex flex-row-reverse"
          >
            {he.conversations.chat.backToList}
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowLeft className="mr-2 h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {participant && (
            <ConversationChat
              conversationId={id}
              messages={messages || []}
              isLoading={loading}
              participant={participant}
            />
          )}
        </div>
        <div className="space-y-6">
          <EnhancedParticipantCard
            participantId={conversation?.participantId || ''}
          />

          {messages && <PhotosFromConversation messages={messages} />}

          {conversation?.participantId && (
            <ParticipantGroups participantId={conversation.participantId} />
          )}

          {conversation && (
            <>
              <ConversationInfo
                startedAt={conversation.startedAt}
                status={conversation.status}
                conversationType={conversation.conversationType}
                lastMessageAt={conversation.lastMessageAt}
                messagesCount={messages?.length}
                currentNode={conversation.currentNode}
              />
              <ResetNodeButton conversationId={id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
