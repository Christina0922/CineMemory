import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CineMemory - Find Movies from Your Memories',
  description: 'Unified movie search engine powered by memory sentences',
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

