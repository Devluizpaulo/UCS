
'use client';

import { Suspense } from "react";
import LoginPage from "../login/page";
import { ResetPasswordModal } from "@/components/auth/reset-password-form";

export default function ActionHandlerPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <LoginPage />
            <ResetPasswordModal />
        </Suspense>
    );
}
