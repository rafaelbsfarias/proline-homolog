import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/modules/common/components/providers';

export const metadata: Metadata = {
  title: 'ProLine',
  description: 'Sistema de gestão ProLine',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
