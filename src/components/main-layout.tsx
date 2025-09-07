'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  FileSpreadsheet,
  LayoutDashboard,
  Library,
  Settings,
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  FileText,
  Loader2,
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
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sidebar';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase-config';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
};

const navItems: NavItem[] = [
  { href: '/', icon: LayoutDashboard, label: 'Painel' },
  { href: '/analysis', icon: Library, label: 'Análise' },
  { href: '/reports', icon: FileText, label: 'Relatórios' },
  { href: '/settings', icon: Settings, label: 'Configurações' },
  { href: '/alerts', icon: Bell, label: 'Alertas' },
];

function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const auth = getAuth(app);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                // If not logged in, redirect to login page, except for the login page itself
                if (pathname !== '/login') {
                    router.push('/login');
                } else {
                   setLoading(false);
                }
            } else {
                // If logged in and on the login page, redirect to home
                if (pathname === '/login') {
                    router.push('/');
                } else {
                    setLoading(false);
                }
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [auth, router, pathname]);

    if (loading) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    // Do not render the layout on the login page
    if (pathname === '/login') {
        return <>{children}</>;
    }


    return <>{children}</>;
}


export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    html.classList.toggle('light');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no Logout',
        description: 'Não foi possível desconectar. Tente novamente.',
      });
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  return (
    <AuthProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3 p-4 h-16 border-b">
              <FileSpreadsheet className="size-8 text-primary" />
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Índice UCS
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
                  {loadingUser ? (
                      <>
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="flex flex-col gap-1.5 flex-1">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-full" />
                          </div>
                      </>
                  ) : user ? (
                      <>
                          <Avatar className="h-9 w-9">
                              <AvatarImage
                                  src={user.photoURL ?? undefined}
                                  alt={user.displayName ?? 'Usuário'}
                                  data-ai-hint="profile picture"
                              />
                              <AvatarFallback>
                                  {getInitials(user.displayName)}
                              </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col truncate">
                              <span className="truncate font-medium">{user.displayName ?? 'Usuário'}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                  {user.email ?? 'Não foi possível carregar o e-mail'}
                              </span>
                          </div>
                      </>
                  ) : (
                      <>
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>
                                  <UserIcon className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col truncate">
                              <span className="truncate font-medium">Não conectado</span>
                          </div>
                      </>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="ml-2">Alternar Tema</span>
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
    </AuthProvider>
  );
}
