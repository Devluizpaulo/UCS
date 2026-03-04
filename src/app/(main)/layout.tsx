
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
  useSidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  LogOut,
  Sparkles,
  History,
  PieChart,
  BarChart3,
  SlidersHorizontal,
  ChevronLeft,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoUCS } from '@/components/logo-bvm';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import type { UserRecord } from 'firebase-admin/auth';
import { UserFormModal, type UserFormValues } from '@/components/admin/user-form-modal';
import { useToast } from '@/hooks/use-toast';
import { updateUser, acceptLgpd } from '@/lib/admin-actions';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { LgpdConsentModal } from '@/components/lgpd-consent-modal';
import { cn } from '@/lib/utils';

function UserProfile() {
    const { user, isUserLoading } = useUser();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const { toast } = useToast();
    const { state } = useSidebar();
    
    if (isUserLoading) {
        return (
            <div className="flex items-center gap-2 p-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
        );
    }

    if (!user) return null;
    
    const getInitials = (email: string | null) => {
        if (!email) return '..';
        return (user.displayName?.[0] || email[0]).toUpperCase();
    }

    return (
        <>
            <div 
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors border-t border-slate-100"
                onClick={() => setIsProfileModalOpen(true)}
            >
                <Avatar className="h-10 w-10 rounded-lg border border-slate-200">
                    <AvatarFallback className="bg-slate-100 text-slate-900 font-bold rounded-lg text-lg">
                        {getInitials(user.email)}
                    </AvatarFallback>
                </Avatar>
                {state !== 'collapsed' && (
                    <div className="flex-1 truncate">
                        <p className="font-bold text-sm truncate text-slate-900">
                            {user.displayName || user.email?.split('@')[0]}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                            {user.email}
                        </p>
                    </div>
                )}
            </div>
             <UserFormModal
                isOpen={isProfileModalOpen}
                onOpenChange={setIsProfileModalOpen}
                onSubmit={async (values) => {
                    if (!user) return;
                    try {
                        await updateUser(user.uid, values);
                        toast({ title: 'Sucesso', description: 'Seu perfil foi atualizado.' });
                        setIsProfileModalOpen(false);
                    } catch (error: any) {
                        toast({ variant: 'destructive', title: 'Erro', description: error.message });
                    }
                }}
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
  const { isMobile, setOpenMobile, toggleSidebar, state } = useSidebar();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState({ checked: false, required: false });

  useEffect(() => {
    if (user) {
      const checkUserStatus = async () => {
        const adminDocRef = doc(firestore, 'roles_admin', user.uid);
        const userDocRef = doc(firestore, 'users', user.uid);
        
        try {
            const [adminSnap, userSnap] = await Promise.all([
                getDoc(adminDocRef),
                getDoc(userDocRef),
            ]);

            setIsAdmin(adminSnap.exists());

            if (userSnap.exists() && userSnap.data().lgpdAccepted) {
              setLgpdConsent({ checked: true, required: false });
            } else {
              setLgpdConsent({ checked: false, required: true });
            }
        } catch (error) {
            setLgpdConsent({ checked: false, required: true });
        }
      };
      checkUserStatus();
    }
  }, [user, firestore]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/');
  };
  
  const handleLgpdAccept = async () => {
    if (!user) return;
    try {
        await acceptLgpd(user.uid);
        setLgpdConsent({ checked: true, required: false });
        toast({ title: 'Obrigado!', description: 'Consentimento aceito.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  if (isUserLoading && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Relatórios IA', icon: Sparkles, href: '/reports' },
    { label: 'Análise Avançada', icon: TrendingUp, href: '/analysis/trends' },
    { label: 'Composição', icon: PieChart, href: '/analysis/composition' },
    { label: 'Comparador', icon: BarChart3, href: '/comparador' },
  ];

  return (
    <>
      <LgpdConsentModal 
        isOpen={lgpdConsent.required && !lgpdConsent.checked}
        onAccept={handleLgpdAccept}
        onReject={handleSignOut}
      />
      <div className={cn("flex h-screen w-full bg-white", lgpdConsent.required && !lgpdConsent.checked && 'blur-sm pointer-events-none')}>
        <Sidebar className="border-r border-slate-100 shadow-sm" collapsible="icon">
          <SidebarHeader className="h-16 flex flex-row items-center justify-between px-4">
            <Link href="/dashboard" className="flex items-center">
              <LogoUCS variant="text" className="text-2xl" />
            </Link>
            <button 
              onClick={toggleSidebar} 
              className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 group-data-[collapsible=icon]:hidden"
            >
              <ChevronLeft size={18} />
            </button>
          </SidebarHeader>
          <SidebarContent className="px-2 pt-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href} onClick={handleMenuItemClick}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-6 rounded-lg transition-all text-slate-600 font-medium hover:bg-slate-50",
                      pathname === item.href && "bg-[#10b981] text-white hover:bg-[#10b981] hover:text-white shadow-md shadow-emerald-100"
                    )}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-white" : "text-slate-400")} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            {isAdmin && (
              <>
                <div className="px-4 py-4 group-data-[collapsible=icon]:hidden">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administração</p>
                </div>
                <SidebarMenu>
                  <SidebarMenuItem onClick={handleMenuItemClick}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/admin/users'}
                      className={cn(
                        "flex items-center gap-3 px-3 py-6 rounded-lg transition-all text-slate-600 font-medium hover:bg-slate-50",
                        pathname === '/admin/users' && "bg-[#10b981] text-white hover:bg-[#10b981] shadow-md shadow-emerald-100"
                      )}
                      tooltip="Usuários"
                    >
                      <Link href="/admin/users">
                        <User className={cn("h-5 w-5", pathname === '/admin/users' ? "text-white" : "text-slate-400")} />
                        <span>Usuários</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem onClick={handleMenuItemClick}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/admin/audit'}
                      className={cn(
                        "flex items-center gap-3 px-3 py-6 rounded-lg transition-all text-slate-600 font-medium hover:bg-slate-50",
                        pathname === '/admin/audit' && "bg-[#10b981] text-white hover:bg-[#10b981] shadow-md shadow-emerald-100"
                      )}
                      tooltip="Auditoria"
                    >
                      <Link href="/admin/audit">
                        <History className={cn("h-5 w-5", pathname === '/admin/audit' ? "text-white" : "text-slate-400")} />
                        <span>Auditoria</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {process.env.NODE_ENV === 'development' && (
                    <SidebarMenuItem onClick={handleMenuItemClick}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === '/dev'}
                        className={cn(
                          "flex items-center gap-3 px-3 py-6 rounded-lg transition-all text-slate-600 font-medium hover:bg-slate-50",
                          pathname === '/dev' && "bg-[#10b981] text-white hover:bg-[#10b981] shadow-md shadow-emerald-100"
                        )}
                        tooltip="Dev Tools"
                      >
                        <Link href="/dev">
                          <SlidersHorizontal className={cn("h-5 w-5", pathname === '/dev' ? "text-white" : "text-slate-400")} />
                          <span>Dev Tools</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </>
            )}
          </SidebarContent>
          <div className="mt-auto flex flex-col">
            <SidebarMenu className="px-2 pb-2">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleSignOut} 
                  className="flex items-center gap-3 px-3 py-6 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
                  tooltip="Sair"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <UserProfile />
          </div>
        </Sidebar>
        <SidebarInset className="bg-slate-50/50">
          <div className="md:hidden p-4 border-b bg-white flex items-center gap-2">
            <SidebarTrigger />
            <LogoUCS variant="text" className="text-xl" />
          </div>
          {children}
        </SidebarInset>
      </div>
    </>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}
