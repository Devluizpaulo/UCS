import type { ElementType, ReactNode } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: ElementType;
  children?: ReactNode;
};

export function PageHeader({ title, description, icon: Icon, children }: PageHeaderProps) {
  return (
    <header className="flex h-auto min-h-16 items-start gap-4 border-b bg-background/95 px-4 sticky top-0 z-30 sm:px-6 py-4">
      <SidebarTrigger className="md:hidden self-center" />
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
        <div className="flex-1">
          <h1 className="font-semibold text-lg md:text-2xl">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto">{children}</div>
    </header>
  );
}
