
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getParticipantById } from '@/lib/actions/participants';
import he from '@/locales/he';
import { ArrowLeft, Phone, Copy } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ParticipantDetailsSection } from './components/participant-details-section';
import { ParticipantGroupsSection } from './components/participant-groups-section';
import { ParticipantConversationsSection } from './components/participant-conversations-section';
import { ParticipantPersonsSection } from './components/participant-persons-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ParticipantDetailPageProps {
  id: string;
}

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<ParticipantDetailPageProps>;
}) {
  const { id } = await params;

  // Fetch participant data
  const participant = await getParticipantById(id);

  if (!participant) {
    notFound();
  }

  // Get initials from participant name
  const initials = participant.name
    ? participant.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'NA';

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      {/* Header with improved layout for RTL */}
      <div className="bg-card rounded-lg p-6 shadow-sm border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <Button variant="outline" asChild className="mb-2 sm:mb-0 self-start">
            <Link
              href="/dashboard/participants"
              className="flex flex-row-reverse items-center"
            >
              {he.participants.backToList}
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-4">
            <Badge
              variant={
                participant.status === 'active' ? 'default' : 'secondary'
              }
              className="mr-2"
            >
              {participant.status === 'active'
                ? he.participants.status.active
                : he.participants.status.inactive}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-2xl font-bold">{participant.name}</h1>
            <div className="flex items-center mt-1 text-muted-foreground">
              <Phone className="h-4 w-4 ml-0.5 mr-1.5" />
              <span>{participant.phoneNumber}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="details" className="flex-1 sm:flex-none">
            {he.participants.tabs.details}
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex-1 sm:flex-none">
            {he.participants.tabs.groups}
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex-1 sm:flex-none">
            {he.participants.tabs.conversations}
          </TabsTrigger>
          <TabsTrigger value="persons" className="flex-1 sm:flex-none">
            {he.participants.tabs.persons}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-1/3" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center mb-4">
                      <Skeleton className="h-20 w-20 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <ParticipantDetailsSection participant={participant} />
          </Suspense>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-1/3" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            }
          >
            <ParticipantGroupsSection participantId={id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-1/3" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            }
          >
            <ParticipantConversationsSection participantId={id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="persons" className="space-y-6">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-1/3" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            }
          >
            <ParticipantPersonsSection participantId={id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
