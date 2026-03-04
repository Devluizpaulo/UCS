import { LoginForm } from "@/components/auth/login-form";
import { LogoUCS } from "@/components/logo-bvm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    return (
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
    )
}