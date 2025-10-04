import type { ElementType, ReactNode } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: ElementType;
  children?: ReactNode;
};

export function PageHeader({ title, description, icon: Icon, children }: PageHeaderProps) {
  return (
    <header className={cn(
        "flex h-auto min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-background/95 px-4 py-3 sm:px-6",
        "sticky top-0 z-30"
      )}>
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <SidebarTrigger className="lg:hidden" />
        {Icon && <Icon className="h-6 w-6 text-muted-foreground hidden sm:block" />}
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-lg md:text-2xl truncate">{title}</h1>
          {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
