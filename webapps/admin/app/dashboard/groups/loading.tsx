import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import he from '@/locales/he';

export default function GroupsLoading() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-72" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="h-12 border-b px-4 flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-1">
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 border-b px-4 flex items-center">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="flex-1">
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
