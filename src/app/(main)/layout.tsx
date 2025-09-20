
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
  { href: '/', label: 'Painel', icon: LayoutDashboard },
];

const analysisItems = [
    { href: '/analysis/trends', label: 'Tendências', icon: LineChart },
    { href: '/analysis/risk', label: 'Risco', icon: ShieldAlert },
    { href: '/analysis/scenarios', label: 'Cenários', icon: CandlestickChart },
];

const toolsItems = [
    { href: '/calculator', label: 'Calculadora', icon: Calculator },
    { href: '/reports', label: 'Relatórios', icon: FileText },
];

const adminItems = [
    { href: '/admin/users', label: 'Usuários', icon: Users },
    { href: '/admin/formula', label: 'Fórmula do Índice', icon: SlidersHorizontal },
    { href: '/admin/assets', label: 'Ativos do Índice', icon: Archive },
];


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

    const isRouteActive = (href: string) => pathname === href || (href === '/' && pathname.startsWith('/dashboard'));
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
                    isActive={isRouteActive('/dashboard')}
                    tooltip={{ children: item.label }}
                  >
                    <Link href="/dashboard">
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <Accordion type="multiple" className="w-full group-data-[collapsible=icon]:hidden">
                {/* Análise Estratégica */}
                <AccordionItem value="analysis" className="border-none">
                    <AccordionTrigger 
                        className="py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground [&[data-state=open]>svg]:text-sidebar-primary"
                        isNested
                    >
                       <div className="flex items-center gap-2">
                           <TrendingUp className="h-4 w-4" /> Análise Estratégica
                       </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-1">
                        <SidebarMenu className="p-0 pl-4">
                            {analysisItems.map(item => (
                                 <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isRouteActive(item.href)}
                                        size="sm"
                                        className="h-8"
                                    >
                                        <Link href={item.href}>
                                            <item.icon/>
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Ícone para Análise quando colapsado */}
              <div className="hidden group-data-[collapsible=icon]:block">
                 <SidebarMenuButton asChild isActive={isGroupActive(analysisItems)} tooltip={{ children: 'Análise Estratégica' }}>
                      <Link href="/analysis/trends"><TrendingUp /></Link>
                 </SidebarMenuButton>
              </div>

               {toolsItems.map((item) => (
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

              <Accordion type="multiple" className="w-full group-data-[collapsible=icon]:hidden">
                {/* Administração */}
                <AccordionItem value="admin" className="border-none">
                    <AccordionTrigger 
                        className="py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground [&[data-state=open]>svg]:text-sidebar-primary"
                        isNested
                    >
                       <div className="flex items-center gap-2">
                           <AreaChart className="h-4 w-4" /> Administração
                       </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-1">
                        <SidebarMenu className="p-0 pl-4">
                            {adminItems.map(item => (
                                 <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isRouteActive(item.href)}
                                        size="sm"
                                        className="h-8"
                                    >
                                        <Link href={item.href}>
                                            <item.icon/>
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Ícone para Admin quando colapsado */}
               <div className="hidden group-data-[collapsible=icon]:block">
                 <SidebarMenuButton asChild isActive={isGroupActive(adminItems)} tooltip={{ children: 'Administração' }}>
                      <Link href="/admin/users"><AreaChart /></Link>
                 </SidebarMenuButton>
              </div>

            </SidebarMenu>
          </SidebarContent>

          <SidebarContent className="!flex-grow-0 border-t border-sidebar-border">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={isRouteActive('/admin/settings')}
                        tooltip={{ children: 'Configurações' }}
                    >
                        <Link href="/admin/settings">
                            <Settings />
                            <span>Configurações</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarContent className="!flex-grow-0 border-t border-sidebar-border p-2">
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
          </SidebarContent>
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
