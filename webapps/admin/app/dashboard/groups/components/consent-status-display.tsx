'use client';

import { ConsentStatusCell } from './consent-status-cell';

interface ConsentStatusDisplayProps {
  groupId: string;
  className?: string;
}

export function ConsentStatusDisplay({
  groupId,
  className = '',
}: ConsentStatusDisplayProps) {
  return (
    <div className={className}>
      <ConsentStatusCell groupId={groupId} />
    </div>
  );
}
