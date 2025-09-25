
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InviteInfo {
  name: string;
  email: string;
  phoneNumber?: string;
  link: string;
}

interface InviteLinkModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  inviteInfo: InviteInfo;
}

// Inline SVG for WhatsApp icon
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);


export function InviteLinkModal({ isOpen, onOpenChange, inviteInfo }: InviteLinkModalProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteInfo.link);
      setHasCopied(true);
      toast({ title: 'Sucesso', description: 'Link de convite copiado!' });
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível copiar o link.' });
    }
  };

  const getMailtoLink = () => {
    const subject = encodeURIComponent(`Convite para a Plataforma UCS Index`);
    const body = encodeURIComponent(
      `Olá, ${inviteInfo.name},\n\nVocê foi convidado para acessar a plataforma de monitoramento do Índice UCS.\n\nClique no link abaixo para criar sua senha e começar:\n${inviteInfo.link}\n\nAtenciosamente,\nA Equipe`
    );
    return `mailto:${inviteInfo.email}?subject=${subject}&body=${body}`;
  };

  const getWhatsAppLink = () => {
      const text = encodeURIComponent(
        `Olá, ${inviteInfo.name}. Você foi convidado para a plataforma UCS Index. Crie sua senha e acesse pelo link: ${inviteInfo.link}`
      );
      // Remove non-digit characters from phone number for the link, but keeps the '+'
      const cleanPhoneNumber = inviteInfo.phoneNumber?.replace(/[^0-9+]/g, '').replace('+', '');
      return `https://wa.me/${cleanPhoneNumber}?text=${text}`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar Link de Convite</DialogTitle>
          <DialogDescription>
            O usuário <span className="font-bold">{inviteInfo.name} ({inviteInfo.email})</span> foi criado. Envie o link abaixo para que ele possa definir a senha e acessar a plataforma.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input id="link" defaultValue={inviteInfo.link} readOnly />
          </div>
          <Button type="button" size="icon" onClick={handleCopy}>
            {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-start pt-4 gap-2">
          <Button asChild>
            <a href={getMailtoLink()} target="_blank" rel="noopener noreferrer">
              <Mail className="mr-2 h-4 w-4" /> Enviar por E-mail
            </a>
          </Button>
          {inviteInfo.phoneNumber && (
             <Button asChild variant="outline">
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="mr-2 h-4 w-4" /> Enviar por WhatsApp
                </a>
             </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="sm:ml-auto">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
