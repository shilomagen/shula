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
  tooltipText?: string;
  variant?: 'default' | 'whatsapp' | 'conversation';
  size?: 'sm' | 'lg' | 'icon' | 'default';
  className?: string;
}

export function IdCopyButton({
  id,
  tooltipText,
  variant = 'default',
  size = 'sm',
  className = '',
}: IdCopyButtonProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(id);
  };

  // Determine tooltip text based on variant if not explicitly provided
  const getTooltipText = () => {
    if (tooltipText) return tooltipText;

    switch (variant) {
      case 'whatsapp':
        return `${he.common.copyId} WhatsApp`;
      case 'conversation':
        return he.conversations.fields.copyId;
      default:
        return he.common.copyId;
    }
  };

  // Determine size class based on button size
  const getSizeClass = () => {
    switch (size) {
      case 'lg':
        return 'h-10 w-10';
      case 'icon':
        return 'h-9 w-9';
      case 'default':
        return 'h-9 w-9';
      case 'sm':
      default:
        return 'h-8 w-8';
    }
  };

  // Determine icon size class based on button size
  const getIconSizeClass = () => {
    switch (size) {
      case 'lg':
        return 'h-4 w-4';
      case 'icon':
      case 'default':
        return 'h-4 w-4';
      case 'sm':
      default:
        return 'h-3.5 w-3.5';
    }
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={size}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard();
              }}
              className={`${getSizeClass()} p-0 rounded-full`}
            >
              <Copy className={getIconSizeClass()} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
