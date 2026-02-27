import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata: Metadata = {
  title: 'Operfoods',
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
        <ToastContainer position="top-right" theme="colored" />
      </body>
    </html>
  );
}

