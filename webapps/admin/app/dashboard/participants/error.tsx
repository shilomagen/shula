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
import he from '@/locales/he';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container max-w-7xl mx-auto py-6 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive" />
            <CardTitle>
              {he.participants.errors?.loadingError || 'שגיאה בטעינת המשתתפים'}
            </CardTitle>
          </div>
          <CardDescription>
            {he.participants.errors?.loadingErrorDescription ||
              'אירעה שגיאה בטעינת המשתתפים. אנא נסה שוב מאוחר יותר'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={reset}>{he.common.tryAgain}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
