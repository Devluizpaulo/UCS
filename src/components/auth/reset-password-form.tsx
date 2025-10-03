
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { confirmPasswordReset } from 'firebase/auth';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não correspondem.',
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof formSchema>;

export function ResetPasswordForm() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (code) {
        setOobCode(code);
    } else {
        toast({
            variant: 'destructive',
            title: 'Link Inválido',
            description: 'O link de redefinição de senha está incompleto ou é inválido.',
        });
    }
  }, [searchParams, toast]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!oobCode) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível encontrar o código de redefinição.',
      });
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      setIsSuccess(true);
      toast({
        title: 'Senha Alterada!',
        description: 'Você será redirecionado para o login em breve.',
      });
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      let description = 'Ocorreu um erro desconhecido. Tente novamente.';
      if (error.code === 'auth/invalid-action-code') {
        description = 'O link de redefinição é inválido ou já foi utilizado.';
      }
      toast({
        variant: 'destructive',
        title: 'Falha na Redefinição',
        description,
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <h3 className="text-lg font-semibold">Senha alterada com sucesso!</h3>
        <p className="text-sm text-muted-foreground">
          Redirecionando para a página de login...
        </p>
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="bg-background/70" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Nova Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="bg-background/70" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || !oobCode} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Redefinir Senha'
          )}
        </Button>
      </form>
    </Form>
  );
}
