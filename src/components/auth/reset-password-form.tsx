
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LogoUCS } from '../logo-bvm';

const formSchema = z.object({
  password: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não correspondem.',
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof formSchema>;

export function ResetPasswordModal() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    if (mode !== 'resetPassword' || !oobCode) {
        setError('O link utilizado é inválido ou expirou. Por favor, solicite um novo link de redefinição de senha.');
        toast({
            variant: 'destructive',
            title: 'Link Inválido',
            description: 'O link de redefinição de senha está incompleto ou é inválido.',
        });
        setIsVerifying(false);
        // Redirect to login if the link is bad
        router.push('/login');
        return;
    }
    setIsVerifying(false);
  }, [searchParams, toast, router, mode, oobCode]);

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
        description: 'Não foi possível encontrar o código de redefinição. Tente novamente.',
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
      setError(description);
      toast({
        variant: 'destructive',
        title: 'Falha na Redefinição',
        description,
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push('/login');
    }
  };
  
  const renderContent = () => {
      if (isVerifying) {
        return (
            <CardContent className="p-6 text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Verificando link...</p>
            </CardContent>
        );
      }
      if (error) {
        return (
            <CardContent>
                <p className="text-center text-destructive">{error}</p>
                 <div className="mt-4 text-center">
                    <Button variant="link" asChild>
                        <a href="/forgot-password">Solicitar novo link</a>
                    </Button>
                </div>
            </CardContent>
        );
      }
      if (isSuccess) {
        return (
            <CardContent className="p-8 text-center space-y-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold">Senha alterada com sucesso!</h3>
                <p className="text-sm text-muted-foreground">
                Você será redirecionado para a página de login para entrar com sua nova senha.
                </p>
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </CardContent>
        );
      }
      return (
        <CardContent>
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
        </CardContent>
      );
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none" hideCloseButton>
        <Card className="bg-card/90 backdrop-blur-sm border-white/20 text-card-foreground">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <LogoUCS />
                </div>
                <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Crie uma nova senha para sua conta.
                </CardDescription>
            </CardHeader>
            {renderContent()}
        </Card>
      </DialogContent>
    </Dialog>
  );
}
