import type { Metadata } from 'next';
import { Cardo, Work_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
});

const cardo = Cardo({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cardo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BayadinBills — Pay bills with USDC',
  description:
    'Pay electricity, water, internet, and gas bills using USDC on Stellar. No bank needed.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${workSans.variable} ${cardo.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
