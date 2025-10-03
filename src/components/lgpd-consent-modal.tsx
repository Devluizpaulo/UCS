
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Shield } from 'lucide-react';
import Link from 'next/link';

interface LgpdConsentModalProps {
  isOpen: boolean;
  onAccept: () => Promise<void>;
  onReject: () => void;
}

export function LgpdConsentModal({ isOpen, onAccept, onReject }: LgpdConsentModalProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await onAccept();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Termos de Uso e Privacidade</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            Para continuar, você precisa ler e aceitar nossos termos de uso e política de privacidade de dados, em conformidade com a LGPD.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 text-sm text-muted-foreground space-y-3">
            <p>
                Ao usar esta plataforma, você concorda com a coleta e uso de suas informações, como nome e e-mail, para fins de autenticação, segurança e comunicação.
            </p>
            <p>
                Garantimos que seus dados serão tratados com confidencialidade e segurança. Para mais detalhes, consulte nossa{' '}
                <Link href="/privacy-policy" target="_blank" className="underline text-primary">
                    Política de Privacidade
                </Link>.
            </p>
        </div>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox id="terms" checked={isChecked} onCheckedChange={(checked) => setIsChecked(!!checked)} />
          <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Li e aceito os Termos de Uso e a Política de Privacidade.
          </Label>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onReject} className="w-full sm:w-auto">
            Recusar e Sair
          </Button>
          <Button onClick={handleAccept} disabled={!isChecked || isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aceitar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    