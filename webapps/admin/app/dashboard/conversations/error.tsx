'use client';

import he from '@/locales/he';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{he.conversations.title}</h1>
        <p className="text-muted-foreground">{he.conversations.description}</p>
      </div>

      <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-red-200 bg-red-50">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{he.common.error}</h2>
        <p className="text-muted-foreground mb-4">
          {error.message || he.errors.serverError}
        </p>
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          {he.common.tryAgain}
        </Button>
      </div>
    </div>
  );
}
