
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase-config';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { setCookie } from 'cookies-next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [redirectOnSuccess, setRedirectOnSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (redirectOnSuccess) {
        const timer = setTimeout(() => {
            router.push('/');
        }, 500); // Small delay to allow toast to be seen
        return () => clearTimeout(timer);
    }
  }, [redirectOnSuccess, router]);


  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    const auth = getAuth(app);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      const token = await user.getIdToken();
      setCookie('firebaseIdToken', token, { 
          path: '/', 
          maxAge: 24 * 60 * 60, // 24 hours in seconds
      });

      toast({
        title: 'Login bem-sucedido',
        description: 'Bem-vindo de volta! Preparando seu painel...',
      });
      
      setRedirectOnSuccess(true);

    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: error.code === 'auth/invalid-credential' 
            ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
            : 'Ocorreu um erro. Por favor, tente novamente.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
     <div className="relative flex min-h-screen w-full items-center justify-center bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <Image
            src="/image/login.jpg"
            alt="Imagem de uma floresta com árvores altas."
            fill
            priority
            className="h-full w-full object-cover animate-ken-burns"
            data-ai-hint="forest trees"
          />
       </div>
       <div className="absolute inset-0 bg-black/70"></div>
       <div className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-border/20 bg-background/80 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mx-auto grid w-full max-w-sm gap-6">
          <div className="grid gap-2 text-center">
             <div className="flex justify-center items-center gap-2 mb-2">
                <FileSpreadsheet className="size-8 text-primary" />
                <h1 className="text-3xl font-bold">Índice UCS</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Insira suas credenciais para acessar o painel.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                className="bg-background/80"
              />
               {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input id="password" type="password" placeholder="********" {...register('password')} className="bg-background/80"/>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Acessar
            </Button>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
}
