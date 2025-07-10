import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ParticipantLoading() {
  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <div className="flex flex-col">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">פרטים</TabsTrigger>
          <TabsTrigger value="groups">קבוצות</TabsTrigger>
          <TabsTrigger value="conversations">שיחות</TabsTrigger>
          <TabsTrigger value="persons">אנשים</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="persons" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
