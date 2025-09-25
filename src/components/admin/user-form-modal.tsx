
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { UserRecord } from 'firebase-admin/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const userSchema = {
  displayName: z.string().min(3, { message: 'O nome é obrigatório.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  phoneNumber: z.string().optional(),
  disabled: z.boolean().default(false),
}

const createUserSchema = z.object(userSchema);

const updateUserSchema = z.object({
  ...userSchema,
  password: z.string().optional().describe('Deixe em branco para não alterar'),
});

export type UserFormValues = z.infer<typeof createUserSchema> & { password?: string };

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: any) => Promise<void>;
  user?: UserRecord | null;
}

export function UserFormModal({ isOpen, onOpenChange, onSubmit, user }: UserFormModalProps) {
  const isEditing = !!user;
  const formSchema = isEditing ? updateUserSchema : createUserSchema;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      phoneNumber: '',
      password: '',
      disabled: false,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        password: '',
        disabled: user.disabled,
      });
    } else {
      form.reset({
        displayName: '',
        email: '',
        phoneNumber: '',
        password: '',
        disabled: false,
      });
    }
  }, [user, form]);

  const { isSubmitting } = form.formState;

  const handleFormSubmit = async (values: any) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuário' : 'Convidar Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {isEditing 
                ? 'Atualize os dados do usuário.' 
                : "Preencha os dados abaixo. O usuário receberá um link único para definir sua senha e acessar a plataforma."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do usuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+5511999998888" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use o formato internacional (ex: +5511999998888).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditing && (
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder={'Deixe em branco para não alterar'} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}
            <FormField
              control={form.control}
              name="disabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Desativado</FormLabel>
                    <FormDescription>
                      Um usuário desativado não poderá fazer login.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEditing ? 'Salvar Alterações' : 'Criar e Gerar Link'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
