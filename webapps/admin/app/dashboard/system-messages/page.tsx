'use client';

import { Suspense } from 'react';
import { SystemMessagesTable } from './components/system-messages-table';
import { CreateMessageDialog } from './components/create-message-dialog';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Search } from 'lucide-react';
import he from '@/locales/he';
import { useQuery } from '@tanstack/react-query';
import { getAllSystemMessages } from './actions';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

// Enhanced system messages table with search
function EnhancedSystemMessagesTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['systemMessages'],
    queryFn: getAllSystemMessages,
  });

  // Filter messages based on search term
  const filteredMessages = searchTerm
    ? messages.filter(
        (msg) =>
          msg.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : messages;

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="relative w-72">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={he.systemMessages.search.placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8 text-right"
            />
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {he.common.refresh}
          </Button>
        </div>
        <CreateMessageDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {he.systemMessages.actions.create}
          </Button>
        </CreateMessageDialog>
      </div>

      <SystemMessagesTable
        searchTerm={searchTerm}
        filteredMessages={filteredMessages}
        isLoading={isLoading}
      />
    </div>
  );
}

export default function SystemMessagesPage() {
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{he.systemMessages.title}</h1>
        <p className="text-muted-foreground">{he.systemMessages.description}</p>
      </div>

      <Separator className="my-6" />

      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2">{he.common.loading}</span>
          </div>
        }
      >
        <EnhancedSystemMessagesTable />
      </Suspense>
    </div>
  );
}
