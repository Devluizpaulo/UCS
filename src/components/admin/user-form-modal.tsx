
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
  DialogBody,
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
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';

const e164Regex = /^\+[1-9]\d{1,14}$/;

const userSchemaBase = {
  displayName: z.string().min(3, { message: 'O nome é obrigatório.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  phoneNumber: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val;
      // Remove espaços, traços, parênteses e garante que comece com '+'
      let processed = val.replace(/[\s-()]/g, '');
      if (processed.length > 0 && !processed.startsWith('+')) {
        // Assume DDI do Brasil se não houver um '+'
        if (!['55'].includes(processed.substring(0,2))) {
            processed = `+55${processed}`;
        } else {
            processed = `+${processed}`;
        }
      }
      return processed;
    },
    z.string()
      .refine(val => val === '' || val === '+' || val === '+55' || e164Regex.test(val), {
        message: 'Formato inválido. Use o padrão internacional (ex: +5511999998888).',
      })
      .optional()
  ),
  disabled: z.boolean().default(false),
};

const createUserSchema = z.object(userSchemaBase);

const updateUserSchema = z.object({
  ...userSchemaBase,
  password: z.string().optional().refine(
    (val) => val === '' || !val || val.length >= 6,
    { message: 'A nova senha deve ter pelo menos 6 caracteres.' }
  ),
});

export type UserFormValues = z.infer<typeof createUserSchema> & { password?: string };

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: any) => Promise<void>;
  user?: UserRecord | User | null;
  isSelfEdit?: boolean;
}

function isUserRecord(user: any): user is UserRecord {
  return user && 'metadata' in user && 'creationTime' in user.metadata;
}

export function UserFormModal({ isOpen, onOpenChange, onSubmit, user, isSelfEdit = false }: UserFormModalProps) {
  const isEditing = !!user;
  const formSchema = isEditing ? updateUserSchema : createUserSchema;
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      phoneNumber: '+55',
      password: '',
      disabled: false,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '+55',
        password: '',
        disabled: isUserRecord(user) ? user.disabled : false,
      });
    } else {
      form.reset({
        displayName: '',
        email: '',
        phoneNumber: '+55',
        password: '',
        disabled: false,
      });
    }
  }, [user, form]);

  const { isSubmitting } = form.formState;

  const handleFormSubmit = async (values: any) => {
    const processedValues = {
      ...values,
      phoneNumber: values.phoneNumber === '+55' ? '' : values.phoneNumber,
    };
    await onSubmit(processedValues);
    if (!isEditing) {
        form.reset();
    }
  };

  const title = isSelfEdit ? 'Editar Meu Perfil' : (isEditing ? 'Editar Usuário' : 'Convidar Novo Usuário');
  const description = isSelfEdit 
    ? 'Atualize seus dados pessoais.' 
    : (isEditing ? 'Atualize os dados do usuário.' : "Preencha os dados abaixo. O usuário receberá um link único para que possa definir sua senha e acessar a plataforma.");


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4" id="user-form">
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
                        <Input placeholder="usuario@exemplo.com" {...field} disabled={isEditing} />
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
                        <Input placeholder="+55 11 99999-8888" {...field} />
                    </FormControl>
                    <FormDescription>
                        Use o formato internacional E.164 (ex: +5511999998888).
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
                        <div className="relative">
                            <FormControl>
                                <Input type={showPassword ? 'text' : 'password'} placeholder={'Deixe em branco para não alterar'} {...field} />
                            </FormControl>
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute inset-y-0 right-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <FormDescription>
                            A senha deve ter no mínimo 6 caracteres.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
                {isEditing && !isSelfEdit && (
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
                )}
            </form>
            </Form>
        </DialogBody>
        <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
            </Button>
            <Button type="submit" form="user-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditing ? 'Salvar Alterações' : 'Criar e Gerar Link'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
