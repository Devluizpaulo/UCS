'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon } from 'lucide-react';

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
    if (isUserLoading) return;
    
    if (user && PUBLIC_PAGES.includes(pathname) && pathname !== '/index-details') {
      router.replace('/dashboard');
    }
  }, [isUserLoading, user, router, pathname]);
  
  if (isUserLoading && !PUBLIC_PAGES.includes(pathname)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col login-bg-gradient transition-colors duration-500">
        {/* Theme Toggle placeholder based on UI */}
        <div className="absolute top-6 right-6 z-30">
            <Button variant="outline" size="icon" className="rounded-full bg-white/50 backdrop-blur-sm border-gray-200">
                <Moon className="h-4 w-4 text-slate-700" />
            </Button>
        </div>

        <main className="relative z-20 flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-[440px]">
                {children}
            </div>
        </main>
    </div>
  );
}