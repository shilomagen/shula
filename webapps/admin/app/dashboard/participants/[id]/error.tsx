'use client';

import { Button } from '@/components/ui/button';
import he from '@/locales/he';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ParticipantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleBackToList = () => {
    setIsLoading(true);
    router.push('/dashboard/participants');
  };

  const handleRetry = () => {
    reset();
  };

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-red-700 font-semibold text-lg mb-2">
          {he.common.error}
        </h2>
        <p className="text-red-600">{error.message}</p>
        <div className="mt-4 space-x-2">
          <Button onClick={handleRetry} variant="secondary">
            {he.common.retry}
          </Button>
          <Button
            onClick={handleBackToList}
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : null}
            {he.participants.backToList}
          </Button>
        </div>
      </div>
    </div>
  );
}
