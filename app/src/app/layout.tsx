
'use client';

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { LanguageProvider } from '@/lib/language-context';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { LogoUCS } from '@/components/logo-bvm';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User } from 'lucide-react';
import { MainLayout } from '@/app/main-layout';

const PUBLIC_PAGES = ['/login', '/forgot-password', '/reset-password', '/index-details', '/', '/privacy-policy'];

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPage = PUBLIC_PAGES.includes(pathname);

  useEffect(() => {
    if (isUserLoading) {
      return; 
    }
    
    if (user && isPublicPage && !['/index-details', '/', '/privacy-policy'].includes(pathname)) {
      router.replace('/dashboard');
    }
    
    if (!user && !isPublicPage) {
      router.replace('/login');
    }

  }, [isUserLoading, user, router, pathname, isPublicPage]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isPublicPage) {
    // Simplified public layout
    if (['/', '/index-details', '/privacy-policy'].includes(pathname)) {
        return <div className="w-full">{children}</div>;
    }
    
    // Layout for login, forgot-password, etc.
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

        <main className="relative flex-1 flex items-center justify-center p-4">
             <div className="relative z-10 w-full max-w-sm sm:max-w-md">{children}</div>
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

  // If authenticated, use the main layout with sidebar
  return <MainLayout>{children}</MainLayout>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <LanguageProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              forcedTheme="light"
              disableTransitionOnChange
            >
              <RootLayoutContent>{children}</RootLayoutContent>
              <Toaster />
              <CookieConsentBanner />
            </ThemeProvider>
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
