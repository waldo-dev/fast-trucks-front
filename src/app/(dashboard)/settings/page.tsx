'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useDashboardNavigation } from '@/components/layout/useDashboardNavigation';

type Card = { title: string; href: string; description?: string; icon: string };

export default function SettingsPage() {
  const { isAdmin } = useDashboardNavigation();

  const cards = useMemo<Card[]>(() => {
    const common: Card[] = [
      { title: 'Perfil', href: '/profile', description: 'Tu información y preferencias.', icon: 'person' },
      { title: 'Usuarios', href: '/users', description: 'Gestiona accesos y roles.', icon: 'group' },
      { title: 'Locales', href: '/outlets', description: 'Registros, cajas y configuración por local.', icon: 'storefront' },
      { title: 'Promociones', href: '/promotions', description: 'Descuentos y campañas.', icon: 'local_activity' },
      { title: 'Eventos', href: '/events', description: 'Calendario y configuración de eventos.', icon: 'event' },
      { title: 'Mailing', href: '/mailing', description: 'Campañas y envíos.', icon: 'mail' },
    ];

    if (!isAdmin) return common;

    return [
      { title: 'Resumen global', href: '/admin', description: 'Visión general de la plataforma.', icon: 'dashboard' },
      { title: 'Negocios', href: '/admin/negocios', description: 'Gestión de negocios.', icon: 'apartment' },
      { title: 'Usuarios (admin)', href: '/admin/usuarios', description: 'Usuarios globales.', icon: 'group' },
      { title: 'Configuración (admin)', href: '/admin/configuracion', description: 'Ajustes del sistema.', icon: 'settings' },
      { title: 'Métricas', href: '/admin/metricas', description: 'Uso y actividad.', icon: 'query_stats' },
      { title: 'Eventos globales', href: '/admin/eventos', description: 'Eventos de la plataforma.', icon: 'event_available' },
      { title: 'Soporte', href: '/admin/soporte', description: 'Soporte y actividad.', icon: 'support_agent' },
    ];
  }, [isAdmin]);

  return (
    <div className="flex flex-col gap-5 w-full px-2 sm:px-4 lg:px-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Configuración</p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Administración</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Todo lo administrativo vive aquí. El contexto (Local + Evento) se gestiona arriba.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-xl border border-[#e6e0db] dark:border-[#3d3226] bg-white dark:bg-[#2d2419] p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">{c.icon}</span>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-bold text-[#181411] dark:text-white truncate">{c.title}</span>
                {c.description && (
                  <span className="text-sm text-[#8a7560] dark:text-[#a3907d]">{c.description}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

