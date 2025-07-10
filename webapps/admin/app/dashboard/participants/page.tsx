'use client';

import he from '@/locales/he';
import { ParticipantsDataTable } from './components/participants-data-table';

export default function ParticipantsPage() {
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{he.participants.title}</h1>
        <p className="text-muted-foreground">{he.participants.description}</p>
      </div>

      <ParticipantsDataTable />
    </div>
  );
}
