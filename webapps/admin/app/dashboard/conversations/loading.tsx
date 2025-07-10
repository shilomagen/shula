import he from '@/locales/he';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Loading() {
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{he.conversations.title}</h1>
        <p className="text-muted-foreground">{he.conversations.description}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-5 w-[120px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-5 w-[200px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-5 w-[150px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-5 w-[120px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-5 w-[150px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-5 w-[100px]" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
    </div>
  );
}
