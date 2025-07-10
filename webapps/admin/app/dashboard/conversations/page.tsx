'use client';

import he from '@/locales/he';
import { ConversationsDataTable } from './components/conversations-data-table';

export default function ConversationsPage() {
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{he.conversations.title}</h1>
        <p className="text-muted-foreground">{he.conversations.description}</p>
      </div>

      <ConversationsDataTable />
    </div>
  );
}
