import type { Metadata } from 'next';
import { Assistant } from 'next/font/google';
import './globals.css';
import he from '@/locales/he';
import { Providers } from '@/lib/providers';
import { Toaster } from '@/components/ui/sonner';

const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-assistant',
});

export const metadata: Metadata = {
  title: he.common.fullAppName,
  description: he.common.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${assistant.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
