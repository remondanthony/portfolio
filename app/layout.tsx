import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
