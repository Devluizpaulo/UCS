
'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { LogoUCS } from '@/components/logo-bvm';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User } from 'lucide-react';

const PUBLIC_PAGES = ['/login', '/forgot-password', '/reset-password', '/index-details'];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Não faça nada enquanto o status do usuário está sendo carregado
    }
    
    // Se o usuário está logado e tenta acessar uma página pública (que não seja a de checklist),
    // redireciona para o dashboard.
    if (user && PUBLIC_PAGES.includes(pathname) && pathname !== '/checklist') {
      router.replace('/dashboard');
    }
  }, [isUserLoading, user, router, pathname]);
  
  // Exibe um loader apenas se o usuário está sendo carregado e não há conteúdo para mostrar.
  // Permite que páginas públicas sejam renderizadas imediatamente para usuários não logados.
  if (isUserLoading && !PUBLIC_PAGES.includes(pathname)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Renderiza o layout para usuários não logados ou para páginas públicas permitidas
  // (mesmo que o usuário esteja logado, como no caso de /index-details que pode ser acessado por ambos)
  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-white to-gray-100 text-foreground">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
              <Link href="/" aria-label="Página Inicial">
                <LogoUCS />
              </Link>
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

        <main className="relative flex-1">
             {/* Condicional para o layout de página de detalhes */}
            {pathname === '/index-details' ? (
                <div className="w-full">{children}</div>
            ) : (
                <div className="flex items-center justify-center p-4 h-full">
                    <div className="relative z-10 w-full max-w-sm sm:max-w-md">{children}</div>
                </div>
            )}
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
