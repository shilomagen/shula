import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import he from '@/locales/he';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{he.dashboard.title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {he.dashboard.stats.groups.title}
            </CardTitle>
            <CardDescription>
              {he.dashboard.stats.groups.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {he.dashboard.stats.participants.title}
            </CardTitle>
            <CardDescription>
              {he.dashboard.stats.participants.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {he.dashboard.stats.persons.title}
            </CardTitle>
            <CardDescription>
              {he.dashboard.stats.persons.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {he.dashboard.stats.photos.title}
            </CardTitle>
            <CardDescription>
              {he.dashboard.stats.photos.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{he.dashboard.recentActivity.title}</CardTitle>
            <CardDescription>
              {he.dashboard.recentActivity.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              {he.common.noData}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{he.dashboard.recentPhotos.title}</CardTitle>
            <CardDescription>
              {he.dashboard.recentPhotos.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              {he.common.noData}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
