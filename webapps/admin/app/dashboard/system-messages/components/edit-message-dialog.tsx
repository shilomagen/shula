'use client';

import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import he from '@/locales/he';
import { toast } from 'sonner';
import { updateSystemMessage } from '../actions';
import { SystemMessageResponseDto } from '@/generated/http-clients/backend';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  content: z.string().min(1, { message: 'Content is required' }),
  key: z.string().min(1, { message: 'Key is required' }),
  category: z.enum(['GROUP', 'PERSON', 'NOTIFICATION', 'GENERAL']),
  metadata: z.record(z.any()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMessageDialogProps {
  children: ReactNode;
  message: SystemMessageResponseDto;
}

export function EditMessageDialog({
  children,
  message,
}: EditMessageDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: message.content,
      key: message.key,
      category: message.category,
      metadata: message.metadata,
    },
  });

  const editMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return updateSystemMessage(message.id, {
        category: values.category,
        content: values.content,
        metadata: values.metadata,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemMessages'] });
      toast.success(he.systemMessages.notifications.updated);
      setOpen(false);
    },
    onError: () => {
      toast.error(he.systemMessages.errors.updateError);
    },
  });

  const onSubmit = (values: FormValues) => {
    editMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{he.systemMessages.dialogs.edit.title}</DialogTitle>
          <DialogDescription>
            {he.systemMessages.dialogs.edit.description}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>מפתח</FormLabel>
                  <FormControl>
                    <Input placeholder="הזן מפתח להודעה" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>קטגוריה</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GENERAL">כללי</SelectItem>
                      <SelectItem value="GROUP">קבוצה</SelectItem>
                      <SelectItem value="PERSON">אדם</SelectItem>
                      <SelectItem value="NOTIFICATION">התראה</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{he.systemMessages.form.content.label}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={he.systemMessages.form.content.placeholder}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {he.systemMessages.form.content.description}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {he.common.cancel}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending ? he.common.loading : he.common.save}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
