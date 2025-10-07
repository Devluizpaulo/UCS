
'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import Image from 'next/image';
import { LogoUCS } from '@/components/logo-bvm';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User } from 'lucide-react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se o usuário está carregando, não faça nada.
    if (isUserLoading) {
      return;
    }
    
    // Se o usuário está logado e não está tentando acessar a página de checklist, redirecione para o dashboard.
    if (user && pathname !== '/checklist') {
      router.replace('/dashboard');
    }
  }, [isUserLoading, user, router, pathname]);
  
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Se o usuário estiver logado e na página de checklist, mostre o conteúdo.
  // Se o usuário não estiver logado, mostre o conteúdo (páginas de login, etc.).
  if ((user && pathname === '/checklist') || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
          <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
              <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
              <LogoUCS />
              <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <Button variant="ghost" size="icon" asChild>
                      <Link href="/login">
                          <User className="h-5 w-5" />
                          <span className="sr-only">Acessar Plataforma</span>
                      </Link>
                  </Button>
              </div>
              </div>
          </header>

          <main className="relative flex-1 flex items-center justify-center p-4">
              <Image
                  src="/image/login.jpg"
                  alt="Floresta exuberante ao fundo"
                  fill
                  className="object-cover animate-zoom-in"
                  data-ai-hint="lush forest"
                  priority
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="relative z-10 w-full max-w-sm sm:max-w-md">
                  {children}
              </div>
          </main>
          
          <footer className="border-t bg-background">
              <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
                  <div className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-4 md:text-left">
                      <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} UCS Index. Todos os direitos reservados.</p>
                      <p className="text-sm text-muted-foreground">Fonte dos dados: <a href="https://br.investing.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">investing.com.br</a></p>
                  </div>
              </div>
        </footer>
      </div>
    );
  }
  
  // Se nenhuma das condições acima for atendida (usuário logado, mas não na página de checklist),
  // mostramos um loader enquanto o redirecionamento acontece.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
