
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { auth } from '@/lib/firebase-config';
import { updatePassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const passwordResetSchema = z.object({
  newPassword: z.string()
    .min(6, 'A nova senha deve ter no mínimo 6 caracteres.'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

export function FirstLoginPasswordReset() {
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  const onSubmit = async (data: PasswordResetFormData) => {
    setIsLoading(true);
    const user = auth.currentUser;

    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      setIsLoading(false);
      return;
    }
    
    try {
      // 1. Atualiza a senha no Firebase Auth (cliente)
      await updatePassword(user, data.newPassword);

      // 2. Notifica o backend para atualizar a claim
      const response = await fetch('/api/auth/change-first-login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao finalizar o processo de primeiro login.');
      }
      
      setPasswordChanged(true);
      toast({
        title: 'Senha alterada com sucesso',
        description: 'Sua senha foi atualizada. Você será redirecionado para o painel.',
      });

      // Força o refresh do token para obter a claim 'isFirstLogin: false'
      await user.getIdToken(true);

      setTimeout(() => {
        router.push('/'); // Redireciona para o painel
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      let description = 'Ocorreu um erro inesperado.';
      if (error.code === 'auth/requires-recent-login') {
        description = 'Sua sessão expirou por segurança. Por favor, faça login novamente para alterar sua senha.';
      } else if (error.code === 'auth/weak-password') {
        description = 'A nova senha é muito fraca. Tente uma senha mais forte.';
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar senha',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (passwordChanged) {
    return (
      <div className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
        <div className="relative z-10 flex min-h-screen w-full items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Senha Alterada!</h2>
              <p className="text-muted-foreground mb-4">
                Sua senha foi atualizada com sucesso. Você será redirecionado para o painel em instantes.
              </p>
              <Loader2 className="h-6 w-6 animate-spin" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-md mobile-card mobile-modal">
          <CardHeader className="text-center p-responsive">
            <CardTitle className="text-2xl text-responsive">Alterar Senha</CardTitle>
            <CardDescription className="text-responsive">
              Como este é seu primeiro login, você deve criar uma senha segura.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-responsive">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mobile-form">
              
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-responsive">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    {...form.register('newPassword')}
                    placeholder="Digite sua nova senha"
                    className="pr-10 input-mobile"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.newPassword.message}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  <p>A nova senha deve ter no mínimo 6 caracteres.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-responsive">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...form.register('confirmPassword')}
                    placeholder="Confirme sua nova senha"
                    className="pr-10 input-mobile"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full button-mobile" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar Senha e Acessar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
