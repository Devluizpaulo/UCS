
import type { ReactNode } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background/95 px-4 sticky top-0 z-30 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        <h1 className="font-semibold text-lg md:text-2xl">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
