
'use client';

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { LogoUCS } from "@/components/logo-bvm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');
    
    if (mode === 'resetPassword') {
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

    if (mode === 'verifyEmail') {
        // Você pode adicionar um componente para verificação de email aqui se desejar
        return (
             <Card className="bg-card/90 backdrop-blur-sm border-white/20 text-card-foreground">
                <CardHeader className="text-center">
                    <CardTitle>Verificar E-mail</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center">Seu e-mail foi verificado com sucesso!</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="bg-card/90 backdrop-blur-sm border-white/20 text-card-foreground">
            <CardHeader className="text-center">
                <CardTitle>Ação Inválida</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-destructive">O link utilizado é inválido ou a ação não é reconhecida.</p>
            </CardContent>
        </Card>
    );
}

export default function ActionHandlerPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
