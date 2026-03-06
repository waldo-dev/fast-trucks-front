'use client';

export default function AdminInventarioPage() {
  const sections = [
    { title: 'Inventario global', desc: 'Visibilidad de stock por negocio y alertas.' },
    { title: 'Movimientos', desc: 'Audita entradas, salidas y ajustes con responsables.' },
    { title: 'Integraciones', desc: 'Sincroniza con POS y catálogos para mantener consistencia.' },
  ];

  const resumen = [
    { negocio: 'Pizzería Centro', sku: 84, alertas: 3, stockTotal: 940 },
    { negocio: 'Pizzería Norte', sku: 68, alertas: 1, stockTotal: 780 },
    { negocio: 'Pizzería Sur', sku: 42, alertas: 0, stockTotal: 520 },
  ];

  const movimientos = [
    { negocio: 'Pizzería Centro', type: 'Entrada', item: 'Queso Mozzarella 1kg', qty: 60, ref: 'Compra #9943' },
    { negocio: 'Pizzería Norte', type: 'Salida', item: 'Pizza Cuatro Quesos 30cm', qty: 24, ref: 'Venta POS #2201' },
    { negocio: 'Pizzería Sur', type: 'Ajuste', item: 'Salsa de tomate 3kg', qty: -4, ref: 'Merma cocina' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
          Panel admin · Inventario
        </p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Inventario</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Supervisa y controla el inventario de todos los negocios.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((s) => (
          <div
            key={s.title}
            className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-4 shadow-sm"
          >
            <h3 className="text-base font-bold dark:text-white mb-1">{s.title}</h3>
            <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold dark:text-white">Resumen por negocio (ficticio)</h3>
          <span className="text-xs text-[#8a7560]">Datos ficticios</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[#8a7560] uppercase text-xs tracking-wide">
                <th className="py-2">Negocio</th>
                <th className="py-2">SKUs</th>
                <th className="py-2">Alertas</th>
                <th className="py-2">Stock total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f2f0] dark:divide-[#3d3226]">
              {resumen.map((r) => (
                <tr key={r.negocio}>
                  <td className="py-2 text-[#181411] dark:text-white">{r.negocio}</td>
                  <td className="py-2 font-semibold">{r.sku}</td>
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        r.alertas > 2
                          ? 'bg-red-100 text-red-700'
                          : r.alertas > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">warning</span>
                      {r.alertas}
                    </span>
                  </td>
                  <td className="py-2 text-[#4b5563] dark:text-[#a3907d]">{r.stockTotal} uds</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold dark:text-white">Movimientos recientes (ficticio)</h3>
          <span className="text-xs text-[#8a7560]">Datos ficticios</span>
        </div>
        <ul className="space-y-2 text-sm">
          {movimientos.map((m, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span
                className={`material-symbols-outlined text-sm ${
                  m.type === 'Entrada' ? 'text-green-600' : m.type === 'Salida' ? 'text-red-600' : 'text-amber-600'
                }`}
              >
                {m.type === 'Entrada' ? 'download' : m.type === 'Salida' ? 'upload' : 'sync_problem'}
              </span>
              <div>
                <p className="text-[#181411] dark:text-white font-semibold">
                  {m.negocio} · {m.type} · {m.qty} uds
                </p>
                <p className="text-[#4b5563] dark:text-[#a3907d]">
                  {m.item} — {m.ref}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-2">Próximamente</h3>
        <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
          Habilitaremos vistas detalladas por negocio, ajustes con archivo de evidencia y exportes.
        </p>
      </div>
    </div>
  );
}

