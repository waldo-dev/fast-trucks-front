'use client';

export default function AdminConfiguracionPage() {
  const items = [
    'Planes y precios',
    'Límites por plan',
    'Feature flags',
    'Integraciones',
    'Permisos de admin',
    'Roles internos',
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Configuración</p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Parámetros del SaaS</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Ajusta planes, límites, integraciones y controles de acceso para el panel admin.
        </p>
      </header>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-3">Controles disponibles</h3>
        <ul className="space-y-2 text-sm text-[#4b5563] dark:text-[#a3907d]">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">tune</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-2">Próximos ajustes</h3>
        <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
          Sumaremos edición de planes, llaves de API, gestión de roles y switches de funcionalidades.
        </p>
      </div>
    </div>
  );
}
