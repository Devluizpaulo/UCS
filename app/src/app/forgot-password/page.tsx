
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LogoUCS } from "@/components/logo-bvm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    return (
        <Card className="bg-card text-card-foreground shadow-lg border">
            <CardHeader className="text-center">
                 <div className="flex justify-center mb-4">
                    <LogoUCS />
                </div>
                <CardTitle>Recuperar Senha</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Digite seu e-mail para receber um link de redefinição de senha.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ForgotPasswordForm />
                <div className="mt-4 text-center">
                    <Button variant="link" asChild>
                        <Link href="/login">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Voltar para o Login
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
