
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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoBVM } from '@/components/logo-bvm';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
          <SidebarContent className="!flex-grow-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/settings'}
                  tooltip={{ children: 'Configurações' }}
                >
                  <Link href="/settings">
                    <Settings />
                    <span>Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </div>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
