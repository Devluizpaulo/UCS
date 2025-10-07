import type { Metadata } from 'next';
import '../../checklist.css';

export const metadata: Metadata = {
  title: 'UCS Index Platform — Checklist de Entrega',
  description: 'Checklist interativo para a entrega técnica da UCS Index Platform.',
};

export default function ChecklistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A tag <html> e <body> são gerenciadas pelo RootLayout principal.
  // Este layout apenas aplica o CSS específico e renderiza o conteúdo.
  return <>{children}</>;
}
