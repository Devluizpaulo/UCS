import { LoginForm } from "@/components/auth/login-form";
import { LogoBVM } from "@/components/logo-bvm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    return (
        <Card>
            <CardHeader className="text-center">
                 <div className="flex justify-center mb-4">
                    <LogoBVM />
                </div>
                <CardTitle>Acessar Plataforma</CardTitle>
                <CardDescription>
                    Use seu e-mail e senha para acessar o painel de monitoramento.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LoginForm />
            </CardContent>
        </Card>
    )
}
