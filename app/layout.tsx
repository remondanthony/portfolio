import type { Metadata } from 'next';
import { Simonetta } from 'next/font/google';
import './globals.css';

const simonetta = Simonetta({
  subsets: ['latin'],
  weight: ['400', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-simonetta',
});

export const metadata: Metadata = {
  title: 'VIONICHE — Web & Product Studio',
  description:
    'A senior web & product studio designing and building high-end websites. Berlin, working worldwide.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={simonetta.variable}>
      <body>{children}</body>
    </html>
  );
}
