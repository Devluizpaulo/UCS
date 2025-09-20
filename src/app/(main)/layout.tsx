
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoBVM } from '@/components/logo-bvm';
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
  Archive,
  AreaChart,
  Book,
  Calculator,
  CandlestickChart,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  User,
  Users,
  CircleCheckBig,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppFooter } from '@/components/app-footer';

const menuItems = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/analysis/trends', label: 'Análise Estratégica', icon: TrendingUp },
  { href: '/calculator', label: 'Calculadora', icon: Calculator },
  { href: '/reports', label: 'Relatórios', icon: FileText },
];


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

    const isRouteActive = (href: string) => {
        if (href === '/dashboard') return pathname === href || pathname === '/';
        return pathname.startsWith(href);
    }
    const isGroupActive = (items: { href: string }[]) => items.some(item => pathname.startsWith(item.href));


  return (
    <SidebarProvider>
      <Sidebar>
        <div className="flex h-full flex-col">
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
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isRouteActive(item.href)}
                    tooltip={{ children: item.label }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <div className="mt-auto border-t border-sidebar-border p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start p-2 text-left"
                >
                  <div className="flex w-full items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>LP</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start truncate group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-medium">
                        Luiz Paulo
                      </span>
                      <span className="text-xs text-sidebar-foreground/70">
                        admin@bvm.global
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Luiz Paulo</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@bvm.global
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem><User className="mr-2"/>Meu Perfil</DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/admin/settings"><Settings className="mr-2"/>Configurações</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><LogOut className="mr-2"/>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <div className="flex-1">
            {children}
          </div>
          <AppFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
