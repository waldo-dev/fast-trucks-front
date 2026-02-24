'use client';

export default function PromotionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Promociones</p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Promos y descuentos</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Administra promociones activas, vigencias y reglas para tus productos y locales.
        </p>
      </header>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-2">Próximos pasos</h3>
        <ul className="text-sm text-[#4b5563] dark:text-[#a3907d] list-disc pl-4 space-y-1">
          <li>Listado de promos con estado (borrador, activa, expirada).</li>
          <li>Crear/editar reglas: porcentaje, monto fijo, combos.</li>
          <li>Asignar promos a productos o locales específicos.</li>
        </ul>
      </div>
    </div>
  );
}
