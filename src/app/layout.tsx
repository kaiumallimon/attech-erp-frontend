import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../providers/providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AtTech Solutions | Agency Operations & ERP Monolith',
  description: 'Enterprise Resource Planning, CRM, SDLC & Client Portal for AtTech Solutions',
  icons: {
    icon: '/images/icons/brand-logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} min-h-screen bg-[#FAFAF9] text-[#0B251A] antialiased selection:bg-[#AEFF48] selection:text-[#0B251A] custom-scrollbar`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
