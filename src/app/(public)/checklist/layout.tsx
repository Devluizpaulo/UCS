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
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
