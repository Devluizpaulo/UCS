'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, CheckCircle, AlertTriangle, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(6, 'A nova senha deve ter entre 6 e 8 caracteres.')
    .max(8, 'A nova senha deve ter entre 6 e 8 caracteres.')
    .regex(/^[a-zA-Z]+$|^[0-9]+$|^[a-zA-Z0-9]+$/, 'A senha deve conter apenas letras, apenas números, ou letras e números.'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [tokenError, setTokenError] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Validar token ao carregar a página
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('Token não fornecido.');
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const result = await response.json();

        if (response.ok && result.valid) {
          setTokenValid(true);
        } else {
          setTokenError(result.error || 'Token inválido.');
        }
      } catch (error) {
        console.error('Erro ao validar token:', error);
        setTokenError('Erro ao validar token. Tente novamente.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPasswordReset(true);
        toast({
          title: 'Senha redefinida!',
          description: 'Sua senha foi alterada com sucesso.',
        });
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: result.error || 'Erro ao redefinir senha.',
        });
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro de conexão. Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state durante validação do token
  if (isValidating) {
    return (
      <div className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
        <div className="relative z-10 flex min-h-screen w-full items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">Validando token...</h2>
              <p className="text-muted-foreground">Aguarde enquanto verificamos seu link de recuperação.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Token inválido ou erro
  if (!tokenValid) {
    return (
      <div className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
        <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
              <h2 className="text-2xl font-bold mb-2">Link Inválido</h2>
              <p className="text-muted-foreground mb-6">{tokenError}</p>
              <div className="space-y-3 w-full">
                <Link href="/forgot-password" className="block">
                  <Button className="w-full">
                    Solicitar Nova Recuperação
                  </Button>
                </Link>
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">
                    Voltar ao Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Sucesso - senha redefinida
  if (passwordReset) {
    return (
      <div className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
        <div className="relative z-10 flex min-h-screen w-full items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Senha Redefinida!</h2>
              <p className="text-muted-foreground mb-4">
                Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes.
              </p>
              <Loader2 className="h-6 w-6 animate-spin" />
              <div className="mt-4">
                <Link href="/login">
                  <Button variant="outline">
                    Ir para Login Agora
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Formulário de redefinição de senha
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-md mobile-card mobile-modal">
          <CardHeader className="text-center p-responsive">
            <div className="flex justify-center mb-4">
              <KeyRound className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl text-responsive">Nova Senha</CardTitle>
            <CardDescription className="text-responsive">
              Digite sua nova senha. Ela deve ter entre 6 e 8 caracteres.
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
                  <p>A senha deve ter entre 6 e 8 caracteres (apenas letras, apenas números, ou letras e números).</p>
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
                Redefinir Senha
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Voltar ao Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}