
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

interface InviteLinkModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  email: string;
  inviteLink: string;
}

export function InviteLinkModal({ isOpen, onOpenChange, email, inviteLink }: InviteLinkModalProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setHasCopied(true);
      toast({ title: 'Sucesso', description: 'Link de convite copiado!' });
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível copiar o link.' });
    }
  };

  const getMailtoLink = () => {
    const subject = encodeURIComponent('Você foi convidado para a Plataforma UCS Index');
    const body = encodeURIComponent(
      `Olá,\n\nVocê foi convidado para acessar a plataforma de monitoramento do Índice UCS.\n\nClique no link abaixo para criar sua senha e começar:\n${inviteLink}\n\nAtenciosamente,\nA Equipe`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar Link de Convite</DialogTitle>
          <DialogDescription>
            O usuário <span className="font-bold">{email}</span> foi criado. Envie o link abaixo para que ele possa definir a senha e acessar a plataforma.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input id="link" defaultValue={inviteLink} readOnly />
          </div>
          <Button type="button" size="icon" onClick={handleCopy}>
            {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <DialogFooter className="sm:justify-start pt-4">
          <Button asChild>
            <a href={getMailtoLink()}>
              <Mail className="mr-2 h-4 w-4" /> Enviar por E-mail
            </a>
          </Button>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
