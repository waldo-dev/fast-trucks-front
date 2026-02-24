'use client';

export default function AdminEventosPage() {
  const items = [
    'Total de eventos creados',
    'Tipos de eventos más comunes',
    'Promedio de ventas por evento',
    'Eventos con mayor volumen',
    'Distribución geográfica',
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Eventos globales</p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Inteligencia de eventos</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Vista transversal para entender tendencias y oportunidades de mercado.
        </p>
      </header>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-3">Qué verás aquí</h3>
        <ul className="space-y-2 text-sm text-[#4b5563] dark:text-[#a3907d]">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">travel_explore</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-2">Próximas visualizaciones</h3>
        <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
          Incorporaremos mapas, ranking de eventos y distribución por industria en la siguiente iteración.
        </p>
      </div>
    </div>
  );
}
