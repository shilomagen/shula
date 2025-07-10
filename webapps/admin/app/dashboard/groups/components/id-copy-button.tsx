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
  variant?: 'default' | 'whatsapp';
  className?: string;
}

export function IdCopyButton({
  id,
  variant = 'default',
  className = '',
}: IdCopyButtonProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(id);
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
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
            <p>
              {variant === 'whatsapp'
                ? `${he.common.copyId} WhatsApp`
                : he.common.copyId}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
