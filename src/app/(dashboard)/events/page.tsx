'use client';

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
          Eventos del negocio
        </p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Eventos y calendario</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Aquí podrás listar, crear y monitorear eventos asociados a tus campañas o locales.
        </p>
      </header>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <h3 className="text-base font-bold dark:text-white mb-2">Próximos pasos</h3>
        <ul className="text-sm text-[#4b5563] dark:text-[#a3907d] list-disc pl-4 space-y-1">
          <li>Tabla de eventos con estado, fechas y responsables.</li>
          <li>Acciones rápidas: publicar, pausar, duplicar.</li>
          <li>Integración con métricas de asistencia y ventas.</li>
        </ul>
      </div>
    </div>
  );
}
