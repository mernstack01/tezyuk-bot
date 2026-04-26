import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YukMarkaz Admin',
  description: 'YukMarkaz admin paneli',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
