'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PersonsResponseDto } from '@/generated/http-clients/backend/models';
import {
  usePersonsByParticipant,
  useDeletePerson,
} from '@/lib/hooks/use-persons';
import he from '@/locales/he';
import { format } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import {
  CalendarIcon,
  InfoIcon,
  Search,
  User,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface ParticipantPersonsSectionProps {
  participantId?: string;
}

export function ParticipantPersonsSection({
  participantId,
}: ParticipantPersonsSectionProps) {
  const params = useParams();
  // If participantId is not passed from props, get it from the URL params
  const id = participantId || (params?.id as string);

  // For auth purposes, use the same participant ID for both parameters
  // In a real implementation, you might have different auth logic
  const { data: persons = [], isLoading } = usePersonsByParticipant(id, id);
  const deleteMutation = useDeletePerson(id, id);

  const [searchQuery, setSearchQuery] = useState('');
  const [personToDelete, setPersonToDelete] =
    useState<PersonsResponseDto | null>(null);

  // Handler for deleting a person
  const handleDeletePerson = async () => {
    if (!personToDelete) return;

    try {
      await deleteMutation.mutateAsync(personToDelete.id);
      toast.success(he.common.success, {
        description: `${personToDelete.name} ${he.common.delete} ${he.common.success}`,
      });
      setPersonToDelete(null);
    } catch {
      toast.error(he.common.error, {
        description: `${he.common.error} ${he.common.delete} ${personToDelete.name}`,
      });
    }
  };

  // Filter persons based on search query
  const filteredPersons = persons.filter(
    (person) =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.relationship &&
        person.relationship.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Card className="overflow-hidden border-2 border-muted/20">
      <CardHeader className="bg-muted/10 flex flex-row items-center justify-between">
        <CardTitle>{he.participants.persons.title}</CardTitle>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="ghost" size="icon">
              <InfoIcon className="h-4 w-4" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">
                {he.participants.persons.infoTitle}
              </h4>
              <p className="text-sm">
                {he.participants.persons.infoDescription}
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {persons.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={he.common.search}
                  className="pl-3 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {filteredPersons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 rounded-lg border-2 border-dashed border-muted">
                <User className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium">
                  {persons.length === 0
                    ? he.participants.persons.noPersons
                    : he.common.noData}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  {persons.length === 0
                    ? he.participants.persons.noPersonsDescription
                    : he.common.tryAgain}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPersons.map((person: PersonsResponseDto) => {
                  // Get initials from person name
                  const initials = person.name
                    ? person.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)
                    : 'NA';

                  return (
                    <Card
                      key={person.id}
                      className="overflow-hidden transition-all hover:border-primary/50"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center mb-3">
                          <Avatar className="h-16 w-16 mb-2">
                            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-medium text-lg">{person.name}</h3>
                          {person.relationship && (
                            <span className="text-sm text-muted-foreground">
                              {person.relationship}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mt-4 text-sm">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">
                                {he.persons.fields.createdAt}:
                              </span>{' '}
                              <span>
                                {person.createdAt
                                  ? format(new Date(person.createdAt), 'PPP', {
                                      locale: dateFnsHe,
                                    })
                                  : '-'}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-center mt-4">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setPersonToDelete(person)}
                              className="text-xs"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {he.common.delete}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!personToDelete}
        onOpenChange={(open) => !open && setPersonToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{he.common.confirmation}</AlertDialogTitle>
            <AlertDialogDescription>
              {he.common.areYouSure}{' '}
              {personToDelete?.name
                ? `${he.common.delete} ${personToDelete.name}?`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{he.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {he.common.updating}
                </>
              ) : (
                he.common.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
