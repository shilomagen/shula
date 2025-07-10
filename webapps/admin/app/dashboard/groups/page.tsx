'use client';

import { Separator } from '@/components/ui/separator';
import he from '@/locales/he';
import { GroupStatsCards } from './components/group-stats-cards';
import { GroupsDataTable } from './components/groups-data-table';

export default function GroupsPage() {
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{he.groups.title}</h1>
        <p className="text-muted-foreground">{he.groups.description}</p>
      </div>

      <GroupStatsCards />
      <Separator className="my-6" />
      <GroupsDataTable />
    </div>
  );
}
