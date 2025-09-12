
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
});

const adminSchema = z.object({
  displayName: z.string().min(2, 'O nome é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  phoneNumber: z.string().min(10, 'O telefone deve ter pelo menos 10 dígitos.'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type AdminFormData = z.infer<typeof adminSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const adminForm = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Use o firebaseToken para logar no Firebase SDK do cliente
        const auth = getAuth();
        await signInWithCustomToken(auth, result.firebaseToken);
        
        toast({
          title: 'Login bem-sucedido',
          description: 'Carregando painel...',
        });

        // O onAuthStateChanged no MainLayout irá redirecionar
        router.push('/');

      } else {
        throw new Error(result.error || 'Erro no login');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: error.message || 'Ocorreu um erro. Por favor, tente novamente.',
      });
      setIsLoading(false);
    } 
  };

  const onAdminSubmit = async (data: AdminFormData) => {
    setIsCreatingAdmin(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, role: 'admin' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar administrador');
      }

      toast({
        title: 'Administrador criado!',
        description: 'Faça login com suas novas credenciais.',
      });
      setIsModalOpen(false);
      adminForm.reset();
      loginForm.setValue('email', data.email);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Criar Conta',
        description: error.message || 'Não foi possível criar a conta. Pode ser que um administrador já exista.',
      });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  return (
    <>
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
              
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...loginForm.register('email')}
                    className="bg-background/90 border-border/50 focus:border-green-500 transition-colors h-11"
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                </div>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-green-500 transition-colors underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="********" 
                    {...loginForm.register('password')} 
                    className="bg-background/90 border-border/50 focus:border-green-500 transition-colors h-11"
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
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
             <div className="mt-4 text-center text-sm">
                <Button variant="link" className="text-muted-foreground" onClick={() => setIsModalOpen(true)}>
                  Criar Conta de Administrador
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Primeiro Administrador</DialogTitle>
            <DialogDescription>
              Esta opção é para o primeiro acesso ao sistema. Se já existem usuários, esta operação falhará.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={adminForm.handleSubmit(onAdminSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="admin-name" className="text-right">Nome</Label>
                <Input id="admin-name" {...adminForm.register('displayName')} className="col-span-3" />
                {adminForm.formState.errors.displayName && <p className="col-span-4 text-right text-xs text-destructive">{adminForm.formState.errors.displayName.message}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="admin-email" className="text-right">Email</Label>
                <Input id="admin-email" type="email" {...adminForm.register('email')} className="col-span-3" />
                {adminForm.formState.errors.email && <p className="col-span-4 text-right text-xs text-destructive">{adminForm.formState.errors.email.message}</p>}
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phoneNumber" className="text-right">Telefone Celular</Label>
                <Input id="phoneNumber" {...adminForm.register('phoneNumber')} className="col-span-3" placeholder="(XX) XXXXX-XXXX" />
                {adminForm.formState.errors.phoneNumber && <p className="col-span-4 text-right text-xs text-destructive">{adminForm.formState.errors.phoneNumber.message}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="admin-password" className="text-right">Senha</Label>
                <Input id="admin-password" type="password" {...adminForm.register('password')} className="col-span-3" />
                {adminForm.formState.errors.password && <p className="col-span-4 text-right text-xs text-destructive">{adminForm.formState.errors.password.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isCreatingAdmin}>
                {isCreatingAdmin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

    