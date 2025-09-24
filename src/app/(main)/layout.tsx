'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Settings,
  Archive,
  SlidersHorizontal,
  TrendingUp,
  ShieldAlert,
  FileText,
  Users,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoBVM } from '@/components/logo-bvm';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

function UserProfile() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await auth.signOut();
        router.push('/login');
    };

    if (isUserLoading) {
        return (
            <div className="flex items-center gap-2 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }
    
    const getInitials = (email: string | null) => {
        if (!email) return '..';
        return email.substring(0, 2).toUpperCase();
    }

    return (
        <div className="flex flex-col items-start gap-2 p-2 group-data-[collapsible=icon]:items-center">
            <div className="flex w-full items-center gap-2">
                 <Avatar>
                    <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate group-data-[collapsible=icon]:hidden">
                    <p className="font-semibold text-sm truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                </div>
            </div>
             <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
                onClick={handleSignOut}
            >
                <LogOut className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden ml-2">Sair</span>
            </Button>
        </div>
    );
}


export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <div className="flex flex-col h-full">
          <SidebarHeader>
            <div className="flex h-10 items-center justify-center p-2 group-data-[collapsible=icon]:hidden">
              <LogoBVM className="h-8 w-auto text-primary" />
            </div>
            <div className="hidden h-10 items-center justify-center p-2 group-data-[collapsible=icon]:flex">
              <LogoBVM className="h-8 w-auto text-primary" isIcon />
            </div>
          </SidebarHeader>
          <SidebarContent className="flex-grow">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard'}
                  tooltip={{ children: 'Painel' }}
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Painel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/reports')}
                  tooltip={{ children: 'Relatórios' }}
                >
                  <Link href="/reports">
                    <FileText />
                    <span>Relatórios</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/50 tracking-wider group-data-[collapsible=icon]:text-center">
                Análise
              </p>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/analysis/trends')}
                  tooltip={{ children: 'Análise de Tendências' }}
                >
                  <Link href="/analysis/trends">
                    <TrendingUp />
                    <span>Tendências</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/analysis/risk')}
                  tooltip={{ children: 'Análise de Risco' }}
                >
                  <Link href="/analysis/risk">
                    <ShieldAlert />
                    <span>Risco</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
             <SidebarMenu>
               <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/50 tracking-wider group-data-[collapsible=icon]:text-center">
                Admin
              </p>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/admin/users')}
                  tooltip={{ children: 'Usuários' }}
                >
                  <Link href="/admin/users">
                    <Users />
                    <span>Usuários</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/assets')}
                  tooltip={{ children: 'Gerenciar Ativos' }}
                >
                  <Link href="/assets">
                    <Archive />
                    <span>Gerenciar Ativos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/settings/formula')}
                  tooltip={{ children: 'Fórmula do Índice' }}
                >
                  <Link href="/settings/formula">
                    <SlidersHorizontal />
                    <span>Fórmula</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarContent className="!flex-grow-0 border-t">
             <UserProfile />
          </SidebarContent>
        </div>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
