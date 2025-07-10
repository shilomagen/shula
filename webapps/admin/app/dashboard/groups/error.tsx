'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import he from '@/locales/he';

export default function GroupsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle>{he.groups.errors.loadingError}</CardTitle>
          </div>
          <CardDescription>
            {he.groups.errors.loadingErrorDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>Error: {error.message}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={reset}>{he.common.tryAgain}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
