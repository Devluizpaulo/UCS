
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginModalProps {
  children: React.ReactNode;
}

export function LoginModal({ children }: LoginModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple validation
    if (!email) {
      toast({
        title: 'Erro de Validação',
        description: 'Por favor, insira um endereço de e-mail.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, any email is accepted without a password.
    // In a real app, you would make an API call to your authentication endpoint.
    console.log('Login attempt with email:', email);

    // On success:
    toast({
      title: 'Login Bem-sucedido!',
      description: 'Redirecionando para o painel...',
    });
    
    // Redirect to the dashboard
    router.push('/dashboard');
    
    // Close the modal and reset state
    setIsOpen(false);
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acessar o Painel</DialogTitle>
          <DialogDescription>
            Entre com seu e-mail para acessar o painel de monitoramento em tempo real.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                className="col-span-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {/* Password field is omitted as per requirement */}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
