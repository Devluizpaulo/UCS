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
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase-config';
import { useRouter } from 'next/navigation';

const passwordResetSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(8, 'A nova senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'A senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

interface FirstLoginPasswordResetProps {
  userEmail: string;
  onPasswordChanged: () => void;
}

export function FirstLoginPasswordReset({ userEmail, onPasswordChanged }: FirstLoginPasswordResetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const form = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  const onSubmit = async (data: PasswordResetFormData) => {
    setIsLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Reautenticar o usuário com a senha atual
      const credential = EmailAuthProvider.credential(userEmail, data.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Atualizar a senha
      await updatePassword(user, data.newPassword);

      // Aqui você atualizaria o status isFirstLogin no Firestore
      // await updateDoc(doc(db, 'users', user.uid), { isFirstLogin: false });

      setPasswordChanged(true);
      
      toast({
        title: 'Senha alterada com sucesso',
        description: 'Sua senha foi atualizada. Você será redirecionado para o painel.',
      });

      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        onPasswordChanged();
        router.push('/');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      
      let errorMessage = 'Ocorreu um erro inesperado.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha atual incorreta.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A nova senha é muito fraca.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Por favor, faça login novamente antes de alterar a senha.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar senha',
        description: errorMessage,
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
              Como este é seu primeiro login, você deve alterar sua senha temporária por uma senha segura.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-responsive">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mobile-form">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-responsive">Senha Atual (Temporária)</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...form.register('currentPassword')}
                    placeholder="Digite sua senha temporária"
                    className="pr-10 input-mobile"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

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
                  <p>A senha deve conter:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Pelo menos 8 caracteres</li>
                    <li>1 letra minúscula</li>
                    <li>1 letra maiúscula</li>
                    <li>1 número</li>
                    <li>1 caractere especial (@$!%*?&)</li>
                  </ul>
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
                Alterar Senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}