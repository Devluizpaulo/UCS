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
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  email: z.string().email('Digite um email válido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmittedEmail(data.email);
        setEmailSent(true);
        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada para as instruções de recuperação.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: result.error || 'Erro ao enviar email de recuperação.',
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro de conexão. Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
        <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4">
          <Card className="w-full max-w-md mobile-card">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Email Enviado!</h2>
              <p className="text-muted-foreground mb-4">
                Enviamos as instruções de recuperação para:
              </p>
              <p className="font-semibold text-primary mb-6">{submittedEmail}</p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>• Verifique sua caixa de entrada</p>
                <p>• Não esqueça de verificar o spam</p>
                <p>• O link expira em 30 minutos</p>
              </div>
              <div className="mt-6 space-y-3 w-full">
                <Button 
                  onClick={() => {
                    setEmailSent(false);
                    form.reset();
                  }}
                  variant="outline" 
                  className="w-full"
                >
                  Enviar para outro email
                </Button>
                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
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

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-md mobile-card mobile-modal">
          <CardHeader className="text-center p-responsive">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl text-responsive">Esqueci minha senha</CardTitle>
            <CardDescription className="text-responsive">
              Digite seu email para receber as instruções de recuperação de senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-responsive">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mobile-form">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-responsive">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  {...form.register('email')}
                  className="input-mobile"
                  autoComplete="email"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full button-mobile" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Instruções
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Link>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Não recebeu o email?</strong><br />
                Verifique sua caixa de spam ou entre em contato com o suporte:
                <br />
                <a href="mailto:luizpaulo.jesus@bmv.global" className="text-primary hover:underline">
                  luizpaulo.jesus@bmv.global
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}