'use client';

export default function AdminNegociosPage() {
  const listas = [
    { titulo: 'Vistas rápidas', items: ['Todos los negocios', 'En riesgo (baja actividad)', 'Trial', 'Suspendidos', 'Cancelados'] },
    { titulo: 'Acciones', items: ['Ver detalle', 'Cambiar plan', 'Suspender', 'Reactivar'] },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
          Gestión de clientes (multi-tenant)
        </p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Negocios</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Administra el ciclo de vida de cada negocio: estados clave, riesgo y acciones rápidas.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {listas.map((bloque) => (
          <div
            key={bloque.titulo}
            className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm"
          >
            <h3 className="text-base font-bold dark:text-white mb-2">{bloque.titulo}</h3>
            <ul className="space-y-1 text-sm text-[#4b5563] dark:text-[#a3907d]">
              {bloque.items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-2">Estado actual</h3>
        <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
          Aquí mostraremos un resumen con los negocios por estado (en riesgo, trial, suspendidos, cancelados) y accesos
          directos para tomar acción. Lo completaremos en la siguiente iteración.
        </p>
      </div>
    </div>
  );
}
