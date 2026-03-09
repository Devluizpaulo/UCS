import { LoginForm } from "@/components/auth/login-form";
import { LogoUCS } from "@/components/logo-bvm";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="space-y-6">
            <Card className="bg-white text-slate-900 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border-none rounded-[40px] p-6 md:p-10">
                <CardHeader className="text-center space-y-6 pt-0">
                    <div className="flex justify-center">
                        <LogoUCS variant="text" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-[#1e293b]">Acesso Restrito</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                    <LoginForm />
                </CardContent>
            </Card>
            
            <div className="flex justify-center">
                <Button variant="ghost" asChild className="text-slate-500 hover:text-slate-800 hover:bg-white/50 rounded-full transition-all">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para a Home
                    </Link>
                </Button>
            </div>
        </div>
    )
}
