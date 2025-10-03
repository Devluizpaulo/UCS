
'use client';

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Suspense } from "react";

export default function ActionHandlerPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
