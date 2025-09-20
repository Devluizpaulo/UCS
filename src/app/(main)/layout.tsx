
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
import { LayoutDashboard, Settings } from 'lucide-react';
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
