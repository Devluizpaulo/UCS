
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { firebaseConfig } from '@/lib/firebase-config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
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
  const router = useRouter();
  const { toast } = useToast();
  
  // Safe Firebase initialization
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });


  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Login bem-sucedido',
        description: 'Bem-vindo de volta! Redirecionando...',
      });
      // On success, force redirect to the dashboard.
      router.push('/');
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
    // Do not set isLoading to false on success, as the page will be redirected.
  };

  return (
    <div className="relative h-screen w-full overflow-hidden mobile-container">
        <div className="absolute inset-0 z-0">
            <Image
                src="/image/login.jpg"
                alt="Imagem de uma floresta com árvores altas."
                fill
                priority
                className="h-full w-full object-cover"
                data-ai-hint="forest trees"
            />
            <div className="absolute inset-0 bg-black/70"></div>
       </div>
       <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 sm:px-6 lg:px-8">
           <div className="w-full max-w-md rounded-2xl border border-border/20 bg-background/80 p-4 sm:p-8 shadow-2xl backdrop-blur-sm mobile-card">
            <div className="mx-auto grid w-full max-w-sm gap-6">
                <div className="grid gap-2 text-center">
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <FileSpreadsheet className="size-6 sm:size-8 text-primary" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-responsive">Índice UCS</h1>
                    </div>
                    <p className="text-balance text-muted-foreground">
                    Insira suas credenciais para acessar o painel.
                    </p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 mobile-form">
                    <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        {...register('email')}
                        className="bg-background/80 input-mobile"
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
                    <Input id="password" type="password" placeholder="********" {...register('password')} className="bg-background/80 input-mobile"/>
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full button-mobile" disabled={isLoading}>
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
