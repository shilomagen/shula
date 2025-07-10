'use client';

import he from '@/locales/he';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { createSystemMessage } from '../actions';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CreateSystemMessageDto } from '@/generated/http-clients/backend';

const formSchema = z.object({
  content: z.string().min(1, { message: 'Content is required' }),
  metadata: z.record(z.string()),
  key: z.string().min(1, { message: 'Key is required' }),
  category: z.enum(['GROUP', 'PERSON', 'NOTIFICATION', 'GENERAL']),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateMessageDialogProps {
  children: ReactNode;
}

export function CreateMessageDialog({ children }: CreateMessageDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      key: '',
      metadata: {},
      category: 'GENERAL',
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return createSystemMessage(values as CreateSystemMessageDto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemMessages'] });
      toast.success(he.systemMessages.notifications.created);
      setOpen(false);
    },
    onError: () => {
      toast.error(he.systemMessages.errors.createError);
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{he.systemMessages.dialogs.create.title}</DialogTitle>
          <DialogDescription>
            {he.systemMessages.dialogs.create.description}
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
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? he.common.loading : he.common.save}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
