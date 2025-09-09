
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
import { FileSpreadsheet, Loader2, TrendingUp } from 'lucide-react';
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
        description: 'Carregando painel...',
      });
      // Pequeno delay para mostrar o overlay de carregamento
      setTimeout(() => {
        router.push('/');
      }, 1000);
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
    <>
      {/* Overlay de carregamento que sobrepõe tudo */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-white">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-12 w-12 text-green-400 animate-pulse" />
              <div className="text-2xl font-bold">UCS Index</div>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg">Carregando painel...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Tela de login principal */}
      <div className="relative h-screen w-full overflow-hidden">
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
          <div className="w-full max-w-md rounded-2xl border border-border/20 bg-background/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <div className="mx-auto grid w-full gap-6">
              {/* Logo e título com destaque para mobile */}
              <div className="grid gap-4 text-center">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <div className="relative">
                    <TrendingUp className="h-16 w-16 sm:h-12 sm:w-12 text-green-500 drop-shadow-lg" />
                    <div className="absolute -inset-2 rounded-full bg-green-500/20 blur-xl"></div>
                  </div>
                  <div className="flex flex-col items-center sm:items-start">
                    <h1 className="text-3xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                      Índice UCS
                    </h1>
                    <div className="text-sm text-muted-foreground font-medium">
                      Universal Carbon Standard
                    </div>
                  </div>
                </div>
                <p className="text-balance text-muted-foreground text-sm sm:text-base">
                  Insira suas credenciais para acessar o painel de monitoramento.
                </p>
              </div>
              
              {/* Formulário */}
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register('email')}
                    className="bg-background/90 border-border/50 focus:border-green-500 transition-colors h-11"
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                    <Link
                      href="#"
                      className="text-xs text-muted-foreground hover:text-green-500 transition-colors underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="********" 
                    {...register('password')} 
                    className="bg-background/90 border-border/50 focus:border-green-500 transition-colors h-11"
                    disabled={isLoading}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    'Acessar Painel'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
