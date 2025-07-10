'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GroupWithCountsResponseDto } from '@/generated/http-clients/backend';
import { formatDate } from '@/lib/utils';
import he from '@/locales/he';
import { Copy } from 'lucide-react';

interface GroupDetailsSectionProps {
  group: GroupWithCountsResponseDto;
}

export function GroupDetailsSection({ group }: GroupDetailsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{he.groups.metrics.groupInfo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between py-1 border-b">
          <span className="font-medium">{he.groups.fields.createdAt}</span>
          <span>{formatDate(group?.createdAt || '')}</span>
        </div>
        <div className="flex justify-between py-1 border-b">
          <span className="font-medium">{he.groups.fields.status}</span>
          <Badge
            variant={group?.status === 'active' ? 'default' : 'destructive'}
          >
            {group?.status === 'active'
              ? he.groups.status.active
              : he.groups.status.inactive}
          </Badge>
        </div>
        <div className="flex justify-between py-1 border-b">
          <span className="font-medium">
            {he.groups.fields.totalParticipants}
          </span>
          <span>{group?.participantsCount || 0}</span>
        </div>
        <div className="flex justify-between py-1 border-b">
          <span className="font-medium">{he.groups.fields.totalPersons}</span>
          <span>{group?.personsCount || 0}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="font-medium">{he.groups.fields.whatsappId}</span>
          <div className="flex items-center">
            <span className="ml-2">{group?.whatsappGroupId || ''}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() =>
                navigator.clipboard.writeText(group?.whatsappGroupId || '')
              }
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
