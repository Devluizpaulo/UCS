
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a página de detalhes do índice, que agora serve como landing page.
    router.replace('/index-details');
  }, [router]);

  // Exibe um loader enquanto o redirecionamento acontece
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando plataforma...</p>
      </div>
    </div>
  );
}
