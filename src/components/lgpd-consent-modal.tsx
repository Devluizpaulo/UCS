
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogBody } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()} hideCloseButton>
        <DialogHeader className="items-center text-center">
          <div className="p-3 bg-primary/10 rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">Termos de Uso e Privacidade da BMV</DialogTitle>
          <DialogDescription className="pt-2">
            Para continuar, você precisa ler e aceitar nossa política de privacidade e tratamento de dados, em conformidade com a LGPD.
          </DialogDescription>
        </DialogHeader>
        
        <DialogBody>
            <div className="space-y-4 text-sm text-muted-foreground text-left">
                <p>
                    Ao usar esta plataforma, você concorda com a coleta e uso de suas informações pela BMV para fins de autenticação, segurança, comunicação e melhoria contínua dos nossos serviços.
                </p>
                <p>
                    Garantimos que seus dados serão tratados com confidencialidade e segurança. Para mais detalhes, consulte nossa{' '}
                    <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline text-primary font-semibold hover:text-primary/80">
                        Política de Privacidade completa
                    </Link>.
                </p>
            </div>

            <div className="flex items-center space-x-3 pt-6 pb-2">
              <Checkbox id="terms" checked={isChecked} onCheckedChange={(checked) => setIsChecked(!!checked)} />
              <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                Li e aceito os Termos de Uso e a Política de Privacidade.
              </Label>
            </div>
        </DialogBody>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
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
