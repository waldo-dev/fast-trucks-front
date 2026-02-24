'use client';

export default function PosPedidosActivosPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Terminal POS</p>
        <h1 className="text-2xl font-black text-[#181411] dark:text-white">Pedidos Activos</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Visualiza los pedidos en curso y actualiza su estado en tiempo real.
        </p>
      </div>
      <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-6 shadow-sm">
        <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
          Próximamente: tabla con pedidos activos, botones de avanzar estado y filtros por tipo y canal.
        </p>
      </div>
    </div>
  );
}
