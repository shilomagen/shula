import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getGroupWithCountsById } from '@/lib/actions/groups';
import he from '@/locales/he';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ConsentStatusSection } from './components/consent-status-section';
import { GroupDetailsSection } from './components/group-details-section';
import { ParticipantsSection } from './components/participants-section';

interface GroupDetailPageProps {
    id: string;
  
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<GroupDetailPageProps>;
}) {
  const { id } = await params;
  const group = await getGroupWithCountsById(id);

  if (!group) {
    notFound();
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">{group.name}</h1>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">{he.groups.tabs.details}</TabsTrigger>
          <TabsTrigger value="participants">
            {he.groups.tabs.participants}
          </TabsTrigger>
          <TabsTrigger value="consents">{he.groups.tabs.consents}</TabsTrigger>
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
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            }
          >
            <GroupDetailsSection group={group} />
          </Suspense>
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
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
            <ParticipantsSection groupId={id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="consents" className="space-y-6">
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
            <ConsentStatusSection groupId={id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
