import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'SADAF | Art & Fashion House — Cairo & Alexandria Heritage',
  description: 'SADAF is an immersive digital art and fashion empire blending centuries of Cairo and Alexandrian heritage with AI design technologies.',
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
