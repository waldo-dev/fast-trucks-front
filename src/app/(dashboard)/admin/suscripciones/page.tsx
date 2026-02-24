'use client';

export default function AdminSuscripcionesPage() {
  const secciones = [
    'Planes activos',
    'Historial de pagos',
    'Estado de pago',
    'Renovaciones próximas',
    'Conversión trial → pago',
    'Control manual de facturación',
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
          Suscripciones y facturación
        </p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Planes, pagos y renovaciones</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Monitorea ingresos recurrentes, pagos y conversiones. Esta sección mantiene vivo el SaaS.
        </p>
      </header>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-3">Checklist clave</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#4b5563] dark:text-[#a3907d]">
          {secciones.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-2">Resumen de ingresos</h3>
        <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
          Aquí mostraremos MRR, ARR, churn de ingresos, próximo cobro y facturación pendiente. Lo completaremos con datos
          reales en la siguiente iteración.
        </p>
      </div>
    </div>
  );
}
