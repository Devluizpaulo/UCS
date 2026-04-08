'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  trigger?: ReactNode;
};

export function PageHeader({ title, description, icon, children, trigger }: PageHeaderProps) {
  return (
    <header className={cn(
        "flex h-auto min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 sm:px-6",
        "sticky top-0 z-30 shadow-sm"
      )}>
      <div className="flex flex-1 items-center gap-3 min-w-0">
        {/* Burger Menu Trigger - Always available to toggle sidebar */}
        {trigger}
        
        {/* Mobile/Tablet Logo - Visible only when main sidebar is hidden (lg:hidden) */}
        <div className="flex lg:hidden items-center mr-2">
          <Link href="/dashboard">
            <span className="font-bold text-2xl tracking-tighter text-[#1e293b]">bmv</span>
          </Link>
        </div>

        {icon}
        
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-lg md:text-xl truncate text-slate-900">{title}</h1>
          {description && <p className="text-xs text-muted-foreground truncate hidden md:block">{description}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
