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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginModalProps {
  children: React.ReactNode;
}

export function LoginModal({ children }: LoginModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // On success:
    toast({
      title: 'Login Bem-sucedido!',
      description: 'Redirecionando para a plataforma...',
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
          <DialogTitle>Acessar a Plataforma</DialogTitle>
          <DialogDescription>
            Entre com suas credenciais para acessar o painel de monitoramento em tempo real. Por enquanto, basta clicar em "Entrar".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin}>
          {/* Form fields will go here in the future */}
          <DialogFooter className="pt-4">
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
