
'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  Loader2,
  User,
} from 'lucide-react';
import Image from 'next/image';
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
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { href: '/', icon: LayoutDashboard, label: 'Painel', exact: true },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  // Mock user data for display purposes
  const [user, setUser] = useState<{ displayName: string, email: string }>({ displayName: 'Admin', email: 'admin@example.com' });
  const [loading, setLoading] = useState(false); // No longer checking auth here

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    html.classList.toggle('light');
  };

  const handleLogout = async () => {
    // Clear the mock token cookie
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    toast({
      title: 'Logout bem-sucedido',
      description: 'Você foi desconectado com segurança.',
    });
    router.push('/login');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'A';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.length > 0 ? name[0].toUpperCase() : 'U';
  };

  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }
  
  return (
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link href="/" className="flex items-center gap-2 p-2">
                <Image src="/image/logo.svg" alt="Índice UCS Logo" width={28} height={28} />
                 <span className="text-lg font-semibold duration-200 group-data-[collapsible=icon]:-translate-x-8 group-data-[collapsible=icon]:opacity-0">
                  Índice UCS
                </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
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
            
            <div className="mt-auto">
                 <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith('/profile')}
                        tooltip={{ children: 'Meu Perfil' }}
                      >
                        <Link href="/profile">
                          <User />
                          <span>Meu Perfil</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith('/settings')}
                        tooltip={{ children: 'Configurações' }}
                      >
                        <Link href="/settings">
                          <Settings />
                          <span>Configurações</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </div>
          </SidebarContent>
          <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button
                  variant="ghost"
                  className="flex w-full items-center gap-3 overflow-hidden p-2 text-left text-sm group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                >
                  
                  <Avatar className="h-8 w-8">
                      <AvatarImage
                          src={undefined}
                          alt={user?.displayName || ''}
                          data-ai-hint="profile picture"
                      />
                      <AvatarFallback>
                          {getInitials(user?.displayName)}
                      </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-medium">{user?.displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                          {user?.email}
                      </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Minha Conta
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span>Alternar Tema</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
  );
}
