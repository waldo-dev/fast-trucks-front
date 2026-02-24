'use client';

export default function AdminMetricasPage() {
  const bullets = [
    '% de clientes que usan eventos',
    '% de clientes que imprimen órdenes',
    'Promedio de órdenes por evento',
    'Tiempo promedio de uso',
    'Usuarios activos por día / semana',
    'Adopción de funcionalidades',
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Métricas de uso</p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Uso del producto</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Descubre qué funcionalidades aportan más valor y dónde mejorar la adopción.
        </p>
      </header>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-3">Indicadores clave</h3>
        <ul className="space-y-2 text-sm text-[#4b5563] dark:text-[#a3907d]">
          {bullets.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">insights</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-2">Próximos gráficos</h3>
        <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
          Aquí agregaremos gráficos de adopción, cohortes de uso y comparativas semanales.
        </p>
      </div>
    </div>
  );
}
