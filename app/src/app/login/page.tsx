
import { LoginForm } from "@/components/auth/login-form";
import { LogoUCS } from "@/components/logo-bvm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    return (
        <Card className="bg-card text-card-foreground shadow-lg border">
            <CardHeader className="text-center">
                
                 <div className="flex justify-center mb-4">
                    <LogoUCS />
                </div>
                <CardTitle>Acessar Plataforma</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Use seu e-mail e senha para acessar o painel de monitoramento.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LoginForm />
            </CardContent>
        </Card>
    )
}
