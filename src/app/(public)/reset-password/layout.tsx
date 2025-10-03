
import Image from 'next/image';
import { LogoUCS } from '@/components/logo-bvm';

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <main className="relative flex-1 flex items-center justify-center p-4">
            <Image
                src="/image/login.jpg"
                alt="Floresta exuberante ao fundo"
                fill
                className="object-cover animate-zoom-in"
                data-ai-hint="lush forest"
                priority
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 w-full max-w-sm sm:max-w-md">
                {children}
            </div>
        </main>
        
        <footer className="border-t bg-background">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
                <div className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-4 md:text-left">
                    <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} UCS Index. Todos os direitos reservados.</p>
                </div>
            </div>
      </footer>
    </div>
  );
}
