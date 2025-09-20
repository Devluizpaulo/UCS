
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tabs = [
  { value: 'trends', label: 'Tendências', href: '/analysis/trends' },
  { value: 'risk', label: 'Risco', href: '/analysis/risk' },
  { value: 'scenarios', label: 'Cenários', href: '/analysis/scenarios' },
];

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  const currentTab = tabs.find(tab => pathname.startsWith(tab.href))?.value || 'trends';

  const onTabChange = (value: string) => {
    const tab = tabs.find(t => t.value === value);
    if (tab) {
      router.push(tab.href);
    }
  };

  return (
    <div className="w-full flex-col">
      <div className="border-b">
        <div className="p-4 md:p-6">
            <Tabs value={currentTab} onValueChange={onTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
        </div>
      </div>
      {children}
    </div>
  );
}
