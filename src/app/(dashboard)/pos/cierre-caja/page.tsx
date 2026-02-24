'use client';

export default function PosCierreCajaPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Terminal POS</p>
        <h1 className="text-2xl font-black text-[#181411] dark:text-white">Cierre de Caja</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Revisa totales del turno, cuadraturas y registra el cierre.
        </p>
      </div>
      <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-6 shadow-sm">
        <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
          Próximamente: resumen de ventas por método de pago, diferencias y confirmación de cierre.
        </p>
      </div>
    </div>
  );
}
