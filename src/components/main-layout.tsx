
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Library,
  Settings,
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  FileText,
  Loader2,
  Calculator,
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
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase-config'; // Importar auth
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';


type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { href: '/', icon: LayoutDashboard, label: 'Painel', exact: true },
  { href: '/analysis', icon: Library, label: 'Análise' },
  { href: '/reports', icon: FileText, label: 'Relatórios' },
  { href: '/ucs-calculator', icon: Calculator, label: 'Calculadora UCS' },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    // onAuthStateChanged is the recommended way to get the current user
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        setUser(user);
        const tokenResult = await user.getIdTokenResult(true); // Force refresh token
        const isFirstLogin = tokenResult.claims.isFirstLogin === true;
        
        // Middleware will handle redirection, but we can also log for debugging
        if(isFirstLogin && pathname !== '/first-login-password-reset'){
             console.log("Redirecting to first login password reset...");
             router.push('/first-login-password-reset');
        }

      } else {
        // User is signed out. Middleware will handle the redirect.
        setUser(null);
        router.push('/login');
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router, pathname]);

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    html.classList.toggle('light');
  };

  const handleLogout = async () => {
    try {
      // Limpar cookie JWT
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      // Sign out from Firebase client-side SDK
      await signOut(auth);
      
      // Clear local state
      setUser(null);
      
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      });
      // The onAuthStateChanged listener and middleware will handle the redirect
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

  // If loading or no user, show a full-screen loader.
  // The middleware/auth listener will handle redirection logic.
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Public pages (like the first-login page itself) should not render the main layout
  const noLayoutPaths = ['/first-login-password-reset'];
  if (noLayoutPaths.includes(pathname)) {
      return <>{children}</>;
  }


  return (
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarRail />
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
                  {!user ? (
                      <>
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="flex flex-col gap-1.5 flex-1 group-data-[collapsible=icon]:hidden">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-full" />
                          </div>
                      </>
                  ) : (
                      <>
                          <Avatar className="h-8 w-8">
                              <AvatarImage
                                  src={user.photoURL ?? undefined}
                                  alt={user.displayName ?? 'Usuário'}
                                  data-ai-hint="profile picture"
                              />
                              <AvatarFallback>
                                  {getInitials(user.displayName)}
                              </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                              <span className="truncate font-medium">{user.displayName ?? 'Usuário'}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                  {user.email ?? 'Não foi possível carregar o e-mail'}
                              </span>
                          </div>
                      </>
                  )}
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
