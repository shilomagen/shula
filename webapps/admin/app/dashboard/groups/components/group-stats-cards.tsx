'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGroupStats } from '@/lib/hooks/use-groups';
import { Check, Users, X } from 'lucide-react';
import he from '@/locales/he';

export function GroupStatsCards() {
  const { data: stats, isLoading } = useGroupStats();

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-4 bg-gray-200 animate-pulse rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card className="bg-white hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {he.groups.title}
          </CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card className="bg-white hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {he.groups.status.active}
          </CardTitle>
          <Check className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalActive}</div>
        </CardContent>
      </Card>
      <Card className="bg-white hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {he.groups.status.inactive}
          </CardTitle>
          <X className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalInactive}</div>
        </CardContent>
      </Card>
    </div>
  );
}
