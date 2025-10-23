
'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { LogoUCS } from '@/components/logo-bvm';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User } from 'lucide-react';
import Image from 'next/image';

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
    
    // Se o usuário está logado e tenta acessar uma página pública (que não seja a de checklist ou index-details),
    // redireciona para o dashboard.
    if (user && PUBLIC_PAGES.includes(pathname) && pathname !== '/checklist' && pathname !== '/index-details') {
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
    <div className="relative flex min-h-screen w-full flex-col bg-black text-foreground">
        <Image
            src="/image/login.jpg"
            alt="Floresta com luz solar"
            fill
            className="absolute inset-0 z-0 object-cover opacity-30"
            priority
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-black/50" />

        <header className="sticky top-0 z-20 w-full border-b border-white/10 bg-black/30 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
              <Link href="/" aria-label="Página Inicial">
                <LogoUCS className="text-white" />
              </Link>
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10 hover:text-white">
                    <Link href="/login">
                        <User className="h-5 w-5" />
                        <span className="sr-only">Acessar Plataforma</span>
                    </Link>
                </Button>
            </div>
            </div>
        </header>

        <main className="relative z-20 flex-1 flex items-center justify-center p-4">
             {/* Condicional para o layout de página de detalhes */}
            {pathname === '/index-details' ? (
                <div className="w-full max-w-7xl">{children}</div>
            ) : (
                <div className="relative z-10 w-full max-w-sm sm:max-w-md">{children}</div>
            )}
        </main>
        
        <footer className="relative z-20 border-t border-white/10 bg-black/30">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
                <div className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-4 md:text-left">
                    <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} UCS Index. Todos os direitos reservados.</p>
                    <p className="text-sm text-gray-400">Fonte dos dados: <a href="https://br.investing.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">investing.com.br</a></p>
                </div>
            </div>
      </footer>
    </div>
  );
}
