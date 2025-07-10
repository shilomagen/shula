'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import he from '@/locales/he';
import { Copy } from 'lucide-react';

interface IdCopyButtonProps {
  id: string;
}

export function IdCopyButton({ id }: IdCopyButtonProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(id);
  };

  return (
    <div className="flex justify-center items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard();
              }}
              className="h-8 w-8 p-0 rounded-full"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{he.conversations.fields.copyId}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
