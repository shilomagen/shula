import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px] mt-2" />
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-6"
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-7 w-14 mt-3" />
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      {/* Table skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[300px]" />
        </div>

        <div className="rounded-md border">
          <div className="border-b">
            <div className="flex h-12 items-center px-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex-1">
                  <Skeleton className="h-5 w-[80%]" />
                </div>
              ))}
            </div>
          </div>
          <div>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex h-16 items-center border-b px-4"
              >
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <div key={colIndex} className="flex-1">
                    <Skeleton
                      className={`h-5 w-[${
                        colIndex === 0 ? '70%' : colIndex === 5 ? '30%' : '50%'
                      }]`}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
