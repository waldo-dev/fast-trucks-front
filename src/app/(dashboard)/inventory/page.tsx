'use client';

export default function InventoryPage() {
  const cards = [
    { title: 'Productos', description: 'Revisa existencias y variantes.' },
    { title: 'Movimientos', description: 'Entradas, salidas y ajustes.' },
    { title: 'Alertas', description: 'Stock bajo y reposiciones pendientes.' },
  ];

  const stock = [
    { name: 'Pizza Margarita 30cm', sku: 'PZ-001', qty: 32, min: 10, negocio: 'Pizzería Centro' },
    { name: 'Pizza Pepperoni 30cm', sku: 'PZ-002', qty: 18, min: 12, negocio: 'Pizzería Centro' },
    { name: 'Masa fresca (bollo)', sku: 'MS-010', qty: 110, min: 80, negocio: 'Pizzería Norte' },
    { name: 'Queso Mozzarella 1kg', sku: 'QM-500', qty: 14, min: 20, negocio: 'Pizzería Norte' },
  ];

  const movements = [
    { type: 'Entrada', qty: 20, item: 'Queso Mozzarella 1kg', ref: 'Compra #5123', date: '2026-03-01' },
    { type: 'Salida', qty: 12, item: 'Pizza Pepperoni 30cm', ref: 'Venta POS #9812', date: '2026-03-02' },
    { type: 'Ajuste', qty: -5, item: 'Masa fresca (bollo)', ref: 'Merma', date: '2026-03-02' },
  ];

  const alerts = stock
    .filter((s) => s.qty <= s.min)
    .map((s) => ({ ...s, status: 'Bajo stock' }));

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
          Gestión de inventario
        </p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Inventario</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Controla stock, movimientos y alertas para tus productos.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-4 shadow-sm"
          >
            <h3 className="text-base font-bold dark:text-white mb-1">{card.title}</h3>
            <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold dark:text-white">Stock (ejemplo)</h3>
          <span className="text-xs text-[#8a7560]">Datos ficticios</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[#8a7560] uppercase text-xs tracking-wide">
                <th className="py-2">Producto</th>
                <th className="py-2">SKU</th>
                <th className="py-2">Negocio</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Mínimo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f2f0] dark:divide-[#3d3226]">
              {stock.map((s) => (
                <tr key={s.sku}>
                  <td className="py-2 text-[#181411] dark:text-white">{s.name}</td>
                  <td className="py-2 text-xs text-[#8a7560]">{s.sku}</td>
                  <td className="py-2 text-[#4b5563] dark:text-[#a3907d]">{s.negocio}</td>
                  <td className="py-2 font-semibold">{s.qty}</td>
                  <td className="py-2 text-[#8a7560]">{s.min}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold dark:text-white">Movimientos (ejemplo)</h3>
            <span className="text-xs text-[#8a7560]">Datos ficticios</span>
          </div>
          <ul className="space-y-2 text-sm">
            {movements.map((m, idx) => (
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
                    {m.type} · {m.qty} uds
                  </p>
                  <p className="text-[#4b5563] dark:text-[#a3907d]">
                    {m.item} — {m.ref}
                  </p>
                  <p className="text-xs text-[#8a7560]">{m.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold dark:text-white">Alertas (ejemplo)</h3>
            <span className="text-xs text-[#8a7560]">Datos ficticios</span>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">Sin alertas por ahora.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {alerts.map((a) => (
                <li key={a.sku} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-sm">warning</span>
                  <div>
                    <p className="text-[#181411] dark:text-white font-semibold">
                      {a.name} ({a.sku})
                    </p>
                    <p className="text-[#4b5563] dark:text-[#a3907d]">
                      Stock {a.qty} / mínimo {a.min} — {a.negocio}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

