
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
} from '@/components/ui/sidebar';
import {
  TrendingUp,
  LogOut,
  History,
  PieChart,
  BarChart3,
  ChevronLeft,
  User,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import type { UserRecord } from 'firebase-admin/auth';
import { UserFormModal } from '@/components/admin/user-form-modal';
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
            <div className="flex items-center gap-2 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
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
                className="flex items-center gap-3 p-3 mx-2 my-1 rounded-xl cursor-pointer hover:bg-white hover:shadow-sm transition-all duration-200 group border border-transparent hover:border-slate-100"
                onClick={() => setIsProfileModalOpen(true)}
            >
                <div className="relative">
                    <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                        <AvatarFallback className="bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs">
                            {getInitials(user.email)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                {state !== 'collapsed' && (
                    <div className="flex-1 truncate">
                        <p className="font-bold text-xs truncate text-slate-800 group-hover:text-emerald-700 transition-colors">
                            {user.displayName || user.email?.split('@')[0]}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate tracking-tight font-medium">
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
  const { isMobile, isTablet, setOpenMobile, toggleSidebar, state } = useSidebar();
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
    if (isMobile || isTablet) {
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
    { label: 'Dashboard', icon: LayoutGrid, href: '/dashboard' },
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
      <div className={cn("flex h-screen w-full bg-white overflow-hidden", lgpdConsent.required && !lgpdConsent.checked && 'blur-sm pointer-events-none')}>
        <Sidebar className="border-r border-slate-100 bg-white shadow-xl z-50 h-full" collapsible="icon">
          <SidebarHeader className="h-20 flex flex-row items-center justify-between px-6 bg-white border-b border-slate-50/50">
            <Link href="/dashboard" className="flex items-center group transition-transform active:scale-95 shrink-0">
              <span className="font-black text-3xl tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors group-data-[collapsible=icon]:hidden">bmv</span>
              <div className="hidden group-data-[collapsible=icon]:flex h-10 w-10 items-center justify-center bg-emerald-50 rounded-lg font-black text-xl text-emerald-600">b</div>
            </Link>
            <button 
              onClick={toggleSidebar} 
              className={cn(
                "p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-100",
                state === 'collapsed' && "absolute right-0 translate-x-1/2 bg-white shadow-md border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rotate-180"
              )}
            >
              <ChevronLeft size={18} strokeWidth={2.5} className={cn("transition-transform", state === 'collapsed' && "rotate-0")} />
            </button>
          </SidebarHeader>

          <SidebarContent className="px-3 pt-6 bg-white space-y-4 overflow-y-auto">
            <div>
              <div className="px-4 mb-3 group-data-[collapsible=icon]:hidden">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400/80">Menu Principal</span>
              </div>
              <SidebarMenu className="gap-1.5">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href} onClick={handleMenuItemClick}>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "flex items-center gap-3 px-4 py-5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                          isActive 
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100/50 font-bold hover:bg-emerald-700 hover:text-white" 
                            : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 font-semibold"
                        )}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-500")} />
                          <span className="text-sm tracking-tight">{item.label}</span>
                          {isActive && (
                            <div className="absolute right-0 top-0 h-full w-1 bg-emerald-300 rounded-l-full" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>

            {isAdmin && (
              <div className="pt-4">
                <div className="px-4 mb-3 group-data-[collapsible=icon]:hidden">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400/80">Administração</span>
                </div>
                <SidebarMenu className="gap-1.5">
                  <SidebarMenuItem onClick={handleMenuItemClick}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "flex items-center gap-3 px-4 py-5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                        pathname === '/admin/users' 
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100/50 font-bold hover:bg-emerald-700 hover:text-white" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 font-semibold"
                      )}
                      tooltip="Admins"
                    >
                      <Link href="/admin/users">
                        <User className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", pathname === '/admin/users' ? "text-white" : "text-slate-400 group-hover:text-emerald-500")} />
                        <span className="text-sm tracking-tight">Admins</span>
                        {pathname === '/admin/users' && (
                          <div className="absolute right-0 top-0 h-full w-1 bg-emerald-300 rounded-l-full" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem onClick={handleMenuItemClick}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "flex items-center gap-3 px-4 py-5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                        pathname === '/admin/audit' 
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100/50 font-bold hover:bg-emerald-700 hover:text-white" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 font-semibold"
                      )}
                      tooltip="Auditoria"
                    >
                      <Link href="/admin/audit">
                        <History className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", pathname === '/admin/audit' ? "text-white" : "text-slate-400 group-hover:text-emerald-500")} />
                        <span className="text-sm tracking-tight">Auditoria</span>
                        {pathname === '/admin/audit' && (
                          <div className="absolute right-0 top-0 h-full w-1 bg-emerald-300 rounded-l-full" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}
          </SidebarContent>
          
          <div className="mt-auto flex flex-col border-t border-slate-50 pt-2 bg-slate-50/30">
            <UserProfile />
            <SidebarMenu className="px-3 pb-4">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleSignOut} 
                  className="flex items-center gap-3 px-4 py-5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all font-semibold text-sm group"
                  tooltip="Sair"
                >
                  <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  <span className="tracking-tight">Sair da Conta</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </Sidebar>
        <SidebarInset className="bg-slate-50/50 overflow-y-auto">
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
