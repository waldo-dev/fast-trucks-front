'use client';

export default function AdminIAPage() {
  const items = [
    'Clientes con IA activa',
    'Predicciones generadas',
    'Recomendaciones aplicadas',
    'Alertas emitidas',
    'Adopción por plan',
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Operfoods IA</p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Motor de IA</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Prepara la inteligencia como ventaja competitiva: adopción, resultados y alertas.
        </p>
      </header>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-3">Indicadores de IA</h3>
        <ul className="space-y-2 text-sm text-[#4b5563] dark:text-[#a3907d]">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-2">Próximos pasos</h3>
        <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
          Aquí añadiremos paneles de recomendaciones, precisión de modelos y alertas automatizadas.
        </p>
      </div>
    </div>
  );
}
