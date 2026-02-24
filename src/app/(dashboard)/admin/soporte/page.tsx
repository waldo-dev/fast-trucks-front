'use client';

export default function AdminSoportePage() {
  const items = [
    'Logs recientes',
    'Errores reportados',
    'Tickets abiertos',
    'Actividad sospechosa',
    'Auditoría de acciones admin',
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Soporte y actividad</p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Control operativo</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Supervisa la salud operacional: tickets, errores, seguridad y auditoría.
        </p>
      </header>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-3">Monitoreo</h3>
        <ul className="space-y-2 text-sm text-[#4b5563] dark:text-[#a3907d]">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">rule</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-2">Qué viene</h3>
        <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
          Integraremos tablas de tickets, timelines de actividad y alertas de seguridad para los admins.
        </p>
      </div>
    </div>
  );
}
