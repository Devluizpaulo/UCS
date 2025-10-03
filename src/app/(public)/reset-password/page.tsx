
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { LogoUCS } from "@/components/logo-bvm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

function ResetPasswordContent() {
    return (
        <Card className="bg-card/90 backdrop-blur-sm border-white/20 text-card-foreground">
            <CardHeader className="text-center">
                 <div className="flex justify-center mb-4">
                    <LogoUCS />
                </div>
                <CardTitle>Redefinir Senha</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Digite sua nova senha abaixo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResetPasswordForm />
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
