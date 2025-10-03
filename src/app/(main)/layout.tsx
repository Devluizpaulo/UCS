'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  LogOut,
  Sparkles,
  History,
  PieChart,
  LandPlot,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoUCS } from '@/components/logo-bvm';
import { useAuth, useUser, useSidebar } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import type { UserRecord } from 'firebase-admin/auth';
import { UserFormModal, type UserFormValues } from '@/components/admin/user-form-modal';
import { useToast } from '@/hooks/use-toast';
import { updateUser } from '@/lib/admin-actions';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';


function UserProfile() {
    const { user, isUserLoading } = useUser();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isAdmin, setIsAdmin] = useState(false);

     useEffect(() => {
        if (user) {
            const checkAdmin = async () => {
                const adminRef = doc(firestore, `roles_admin/${user.uid}`);
                const adminSnap = await getDoc(adminRef);
                setIsAdmin(adminSnap.exists());
            };
            checkAdmin();
        }
    }, [user, firestore]);

    const handleProfileUpdate = async (values: UserFormValues) => {
        if (!user) return;
        try {
            await updateUser(user.uid, values);
            toast({ title: 'Sucesso', description: 'Seu perfil foi atualizado.' });
            setIsProfileModalOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        }
    }
    
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
        const nameParts = user.displayName?.split(' ') || [email];
        if (nameParts.length > 1) {
            return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        }
        return email.substring(0, 2).toUpperCase();
    }

    return (
        <>
            <div 
                className="flex flex-col items-start gap-2 p-2 group-data-[collapsible=icon]:items-center cursor-pointer hover:bg-sidebar-accent/50 rounded-md"
                onClick={() => setIsProfileModalOpen(true)}
            >
                <div className="flex w-full items-center gap-2">
                    <Avatar>
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate group-data-[collapsible=icon]:hidden">
                        <p className="font-semibold text-sm truncate">{user.displayName || user.email}</p>
                        <p className="text-xs text-muted-foreground">{isAdmin ? 'Admin' : 'Usuário'}</p>
                    </div>
                </div>
            </div>
             <UserFormModal
                isOpen={isProfileModalOpen}
                onOpenChange={setIsProfileModalOpen}
                onSubmit={handleProfileUpdate}
                user={user as unknown as UserRecord}
                isSelfEdit={true}
            />
        </>
    );
}

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { isMobile, setOpenMobile } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      const checkAdminStatus = async () => {
        const adminDocRef = doc(firestore, 'roles_admin', user.uid);
        const docSnap = await getDoc(adminDocRef);
        setIsAdmin(docSnap.exists());
      };
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user, firestore]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/');
  };

  const handleMenuItemClick = () => {
    if (isMobile && setOpenMobile) {
      setOpenMobile(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Sidebar>
        <div className="flex flex-col h-full">
          <SidebarHeader>
            <div className="flex h-10 items-center justify-center p-2 group-data-[collapsible=icon]:hidden">
              <LogoUCS className="h-8 w-auto" />
            </div>
            <div className="hidden h-10 items-center justify-center p-2 group-data-[collapsible=icon]:flex">
              <LogoUCS className="h-8 w-auto" isIcon />
            </div>
          </SidebarHeader>
          <SidebarContent className="flex-grow">
            <SidebarMenu>
              <SidebarMenuItem onClick={handleMenuItemClick}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard'}
                  tooltip={{ children: 'Dashboard' }}
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem onClick={handleMenuItemClick}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/reports')}
                  tooltip={{ children: 'Relatórios com IA' }}
                >
                  <Link href="/reports">
                    <Sparkles />
                    <span>Relatórios IA</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/50 tracking-wider group-data-[collapsible=icon]:text-center">
                Análise
              </p>
               <SidebarMenuItem onClick={handleMenuItemClick}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/analysis/trends')}
                  tooltip={{ children: 'Análise Histórica' }}
                >
                  <Link href="/analysis/trends">
                    <TrendingUp />
                    <span>Análise Histórica</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem onClick={handleMenuItemClick}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/analysis/profitability')}
                  tooltip={{ children: 'Análise de Rentabilidade' }}
                >
                  <Link href="/analysis/profitability">
                    <LandPlot />
                    <span>Rentabilidade</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem onClick={handleMenuItemClick}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/analysis/composition')}
                  tooltip={{ children: 'Análise de Composição' }}
                >
                  <Link href="/analysis/composition">
                    <PieChart />
                    <span>Composição</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {isAdmin && (
              <SidebarMenu>
                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/50 tracking-wider group-data-[collapsible=icon]:text-center">
                  Admin
                </p>
                <SidebarMenuItem onClick={handleMenuItemClick}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/admin/users')}
                    tooltip={{ children: 'Gerenciar Usuários' }}
                  >
                    <Link href="/admin/users">
                      <Users />
                      <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem onClick={handleMenuItemClick}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/admin/audit')}
                    tooltip={{ children: 'Auditoria de Dados' }}
                  >
                    <Link href="/admin/audit">
                      <History />
                      <span>Auditoria</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarContent>
          <div className="mt-auto">
            <SidebarContent className="!flex-grow-0 border-t">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleSignOut} tooltip={{ children: 'Sair' }}>
                    <LogOut />
                    <span>Sair</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <UserProfile />
            </SidebarContent>
          </div>
        </div>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
}


export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}
