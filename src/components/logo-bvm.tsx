import { cn } from "@/lib/utils";

interface LogoUCSProps extends React.SVGProps<SVGSVGElement> {
    isIcon?: boolean;
    variant?: 'default' | 'text';
}

export function LogoUCS({ isIcon = false, variant = 'default', className, ...props }: LogoUCSProps) {
    if (variant === 'text') {
        return (
            <div className={cn("flex items-center justify-center font-bold text-4xl tracking-tighter text-black", className)}>
                bmv
            </div>
        );
    }

    if (isIcon) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn("w-6 h-6", className)}
                {...props}
            >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
        );
    }

    return (
        <div className={cn("flex items-center gap-2 font-bold text-lg", className)}>
             <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-[#10b981]"
                {...props}
            >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="text-foreground">UCS Index</span>
        </div>
    );
}