'use client';

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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import he from '@/locales/he';
import { MoreHorizontal } from 'lucide-react';
import { ReactNode, useState } from 'react';

export interface ActionMenuItem {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  icon?: ReactNode;
  variant?: 'default' | 'destructive';
  needsConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
  confirmationButtonText?: string;
}

export interface ActionMenuSection {
  label?: string;
  items: ActionMenuItem[];
}

interface ActionMenuProps {
  sections: ActionMenuSection[];
  triggerLabel?: string;
  align?: 'start' | 'end' | 'center';
  className?: string;
}

export function ActionMenu({
  sections,
  triggerLabel = he.common.actions,
  align = 'end',
  className = '',
}: ActionMenuProps) {
  // Dialog state for each item
  const [activeDialogItem, setActiveDialogItem] = useState<{
    sectionIndex: number;
    itemIndex: number;
    isOpen: boolean;
  } | null>(null);

  const handleOpenDialog = (
    sectionIndex: number,
    itemIndex: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveDialogItem({
      sectionIndex,
      itemIndex,
      isOpen: true,
    });
  };

  const handleCloseDialog = () => {
    setActiveDialogItem(null);
  };

  const handleConfirmAction = (item: ActionMenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    item.onClick(e);
    handleCloseDialog();
  };

  return (
    <div className={`flex justify-end ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">{triggerLabel}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
          {sections.map((section, sectionIndex) => (
            <div key={`section-${sectionIndex}`}>
              {section.label && (
                <DropdownMenuLabel>{section.label}</DropdownMenuLabel>
              )}

              {section.items.map((item, itemIndex) => (
                <div key={`item-${sectionIndex}-${itemIndex}`}>
                  {item.needsConfirmation ? (
                    <>
                      <DropdownMenuItem
                        className={
                          item.variant === 'destructive' ? 'text-red-600' : ''
                        }
                        onSelect={(e) => e.preventDefault()} // Prevent closing dropdown when opening alert
                        onClick={(e) =>
                          handleOpenDialog(sectionIndex, itemIndex, e)
                        }
                      >
                        {item.icon && <span className="mr-2">{item.icon}</span>}
                        {item.label}
                      </DropdownMenuItem>

                      <AlertDialog
                        open={
                          activeDialogItem?.sectionIndex === sectionIndex &&
                          activeDialogItem?.itemIndex === itemIndex &&
                          activeDialogItem?.isOpen
                        }
                        onOpenChange={(open) => {
                          if (!open) handleCloseDialog();
                        }}
                      >
                        <AlertDialogContent
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {item.confirmationTitle || he.common.confirmation}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {item.confirmationDescription ||
                                he.common.areYouSure}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={(e) => e.stopPropagation()}
                            >
                              {he.common.cancel}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className={
                                item.variant === 'destructive'
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : ''
                              }
                              onClick={(e) => handleConfirmAction(item, e)}
                            >
                              {item.confirmationButtonText ||
                                (item.variant === 'destructive'
                                  ? he.common.delete
                                  : he.common.confirm)}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <DropdownMenuItem
                      className={
                        item.variant === 'destructive' ? 'text-red-600' : ''
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        item.onClick(e);
                      }}
                    >
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.label}
                    </DropdownMenuItem>
                  )}
                </div>
              ))}

              {sectionIndex < sections.length - 1 && <DropdownMenuSeparator />}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
