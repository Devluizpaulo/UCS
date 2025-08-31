'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  FileSpreadsheet,
  LayoutDashboard,
  Library,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
};

const navItems: NavItem[] = [
  { href: '/', icon: LayoutDashboard, label: 'Painel' },
  { href: '/analysis', icon: Library, label: 'Análise' },
  { href: '/settings', icon: Settings, label: 'Configurações' },
  { href: '/alerts', icon: Bell, label: 'Alertas' },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 p-4 h-16 border-b">
            <FileSpreadsheet className="size-8 text-primary" />
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Índice IVCF
              </h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
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
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex w-full cursor-pointer items-center gap-2 overflow-hidden p-2 text-left text-sm outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src="https://picsum.photos/36"
                    alt="Usuário"
                    data-ai-hint="profile picture"
                  />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <span className="truncate font-medium">Nome do Usuário</span>
                  <span className="truncate text-xs text-muted-foreground">
                    usuario@email.com
                  </span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                 <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                 <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                 <span className="ml-2">Alternar Tema</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
