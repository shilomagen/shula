'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import he from '@/locales/he';
import Link from 'next/link';
import {
  ExternalLink,
  InfoIcon,
  Users,
  Search,
  ChevronLeft,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { useGroupsByParticipant } from '@/lib/hooks/use-groups';
import { GroupWithCountsResponseDto } from '@/generated/http-clients/backend';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ParticipantGroupsSectionProps {
  participantId?: string;
}

export function ParticipantGroupsSection({
  participantId,
}: ParticipantGroupsSectionProps) {
  const params = useParams();
  // If participantId is not passed from props, get it from the URL params
  const id = participantId || (params?.id as string);

  const { data, isLoading } = useGroupsByParticipant(id);
  const groups = data?.items || [];

  const [searchQuery, setSearchQuery] = useState('');

  // Filter groups based on search query
  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.description &&
        group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Card className="overflow-hidden border-2 border-muted/20">
      <CardHeader className="bg-muted/10 flex flex-row items-center justify-between">
        <CardTitle>{he.participants.groups.title}</CardTitle>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="ghost" size="icon">
              <InfoIcon className="h-4 w-4" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">
                {he.participants.groups.title}
              </h4>
              <p className="text-sm">
                {he.participants.groups.noGroupsDescription}
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
            {groups.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={he.groups.search.placeholder}
                  className="pl-3 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 rounded-lg border-2 border-dashed border-muted">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium">
                  {groups.length === 0
                    ? he.participants.groups.noGroups
                    : he.common.noData}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  {groups.length === 0
                    ? he.participants.groups.noGroupsDescription
                    : he.common.tryAgain}
                </p>
              </div>
            ) : (
              <div className="h-[450px] pr-4">
                <div className="grid grid-cols-1 gap-4">
                  {filteredGroups.map((group: GroupWithCountsResponseDto) => (
                    <Card
                      key={group.id}
                      className={cn(
                        'overflow-hidden transition-all hover:border-primary/50',
                        group.status === 'active' ? 'border-green-200' : ''
                      )}
                    >
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-lg truncate">
                              {group.name}
                            </h3>
                            <Badge
                              variant={
                                group.status === 'active'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="ms-2 shrink-0"
                            >
                              {group.status === 'active'
                                ? he.groups.status.active
                                : he.groups.status.inactive}
                            </Badge>
                          </div>
                          {group.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {group.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 items-center mt-3 text-sm">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>
                                {group.participantsCount !== undefined
                                  ? `${he.groups.fields.participantsCount}: ${group.participantsCount}`
                                  : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="border-t px-4 py-2 bg-muted/10 flex justify-end">
                          <Link
                            href={`/dashboard/groups/${group.id}`}
                            className="text-primary hover:underline flex items-center text-sm font-medium"
                          >
                            {he.groups.actions.view}
                            <ChevronLeft className="h-4 w-4 ms-1" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
