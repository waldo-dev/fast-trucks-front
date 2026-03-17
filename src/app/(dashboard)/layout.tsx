'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { config } from '@/lib/config';
import { getCurrentUser, isAuthenticated } from '@/lib/auth';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(!config.auth.enabled);
  const [checking, setChecking] = useState(config.auth.enabled);

  useEffect(() => {
    if (!config.auth.enabled) return;
    let active = true;

    const redirectToLogin = () => {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${next}`);
    };

    const verify = async () => {
      setChecking(true);
      const hasToken = isAuthenticated();
      if (!hasToken) {
        redirectToLogin();
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user) {
          redirectToLogin();
          return;
        }
        if (active) setReady(true);
      } catch {
        redirectToLogin();
      } finally {
        if (active) setChecking(false);
      }
    };

    verify();

    return () => {
      active = false;
    };
    // Solo verificamos una vez al montar para evitar pantalla de "Cargando sesión"
    // en cada navegación interna; si necesitas volver a validar en caliente,
    // agrega lógica de refresco/token listener aquí.
  }, [router]);

  if (!ready || checking) {
    return (
      <div
        className="w-full h-screen flex flex-col items-center justify-center text-center gap-2"
        role="status"
        aria-live="polite"
      >
        <p
          className="text-4xl sm:text-5xl font-black uppercase tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-[#0f172b] via-[#0f172b] to-[#f27f0d] animate-pulse"
          style={{ fontFamily: 'Along Sans, system-ui, sans-serif' }}
        >
          Operfoods
        </p>
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#0f172b]">
          Cargando sesión...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
