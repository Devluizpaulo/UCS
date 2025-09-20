
'use client';

import { LogoBVM } from "@/components/logo-bvm";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export function HomeHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <LogoBVM />
                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <LoginModal>
                        <Button variant="ghost" size="icon">
                            <User className="h-5 w-5" />
                            <span className="sr-only">Login</span>
                        </Button>
                    </LoginModal>
                </div>
            </div>
        </header>
    )
}
