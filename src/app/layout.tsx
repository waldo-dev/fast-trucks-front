import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Fast Trucks',
  description: 'Panel administrativo SaaS para gestión de negocios de comida',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light">
      <body className="bg-background-light dark:bg-background-dark text-[#181411]">
        {children}
      </body>
    </html>
  );
}

