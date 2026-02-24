'use client';

const kpis = [
  { label: 'Negocios activos', value: '1,284', delta: '+5.2%' },
  { label: 'Nuevos este mes', value: '142', delta: '+12.8%' },
  { label: 'Tasa de churn', value: '2.4%', delta: '-0.4%' },
  { label: 'MRR actual', value: '$842k', delta: '+8.1%' },
  { label: 'Crecimiento %', value: '12.5%', delta: '+1.2%' },
  { label: 'Eventos totales', value: '4.2M', delta: '+15.4%' },
  { label: 'Pedidos totales', value: '89.4k', delta: '+6.7%' },
];

const eventos = [
  {
    tipo: 'Pico de latencia del sistema',
    negocio: 'Global Hubs Inc.',
    ubicacion: 'Chicago, US',
    estado: 'Investigando',
    estadoColor: 'amber',
    tiempo: 'Hace 2 minutos',
  },
  {
    tipo: 'Optimización de IA completada',
    negocio: 'Rapid Delivery Ltd.',
    ubicacion: 'Londres, UK',
    estado: 'Éxito',
    estadoColor: 'emerald',
    tiempo: 'Hace 14 minutos',
  },
  {
    tipo: 'Nueva suscripción nivel premium',
    negocio: 'Metro Logistics',
    ubicacion: 'Berlín, DE',
    estado: 'Procesado',
    estadoColor: 'primary',
    tiempo: 'Hace 45 minutos',
  },
];

const EstadoBadge = ({
  texto,
  tono,
}: {
  texto: string;
  tono: 'amber' | 'emerald' | 'primary';
}) => {
  const map = {
    amber: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    primary: 'bg-primary/10 text-primary border border-primary/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${map[tono]}`}>
      {texto}
    </span>
  );
};

export default function AdminOverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Encabezado de página */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
          Resumen de la plataforma
        </p>
        <h1 className="text-[#181411] dark:text-white text-3xl sm:text-4xl font-black leading-tight">
          Salud y rendimiento en tiempo real
        </h1>
        <p className="text-[#8a7560] dark:text-[#a3907d] max-w-3xl">
          Métricas globales para monitorear el ecosistema Fast Trucks, incluyendo negocios, ingresos,
          eventos críticos y crecimiento mensual.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-[#2d2419] p-5 rounded-xl border border-[#e6e0db] dark:border-[#3d3226] shadow-sm flex flex-col justify-between"
          >
            <p className="text-xs font-semibold text-[#8a7560] uppercase tracking-wider">
              {kpi.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold dark:text-white">{kpi.value}</h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {kpi.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Sección de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crecimiento de clientes */}
        <div className="bg-white dark:bg-[#2d2419] p-6 rounded-xl border border-[#e6e0db] dark:border-[#3d3226] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold dark:text-white">Crecimiento mensual de clientes</h4>
              <p className="text-xs text-[#8a7560]">Negocios activos en 6 meses</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">1,284</p>
              <p className="text-[10px] font-bold text-emerald-600">+12.5% vs Q4</p>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-1">
            <div className="relative w-full h-full flex flex-col justify-end">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 150">
                <path
                  className="fill-primary/10"
                  d="M0,130 C40,120 80,100 120,110 C160,120 200,80 240,60 C280,40 320,50 360,30 L400,20 L400,150 L0,150 Z"
                ></path>
                <path
                  className="stroke-primary fill-none"
                  d="M0,130 C40,120 80,100 120,110 C160,120 200,80 240,60 C280,40 320,50 360,30 L400,20"
                  strokeWidth="3"
                ></path>
              </svg>
              <div className="flex justify-between mt-4 text-[10px] font-bold text-[#8a7560] uppercase">
                <span>Ene</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tendencia MRR */}
        <div className="bg-white dark:bg-[#2d2419] p-6 rounded-xl border border-[#e6e0db] dark:border-[#3d3226] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold dark:text-white">Tendencia mensual de MRR</h4>
              <p className="text-xs text-[#8a7560]">Acumulado de ingresos por mes</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">$842k</p>
              <p className="text-[10px] font-bold text-emerald-600">+8.1% crecimiento</p>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-2 px-1">
            {[40, 55, 70, 65, 85, 100].map((height, idx) => (
              <div
                key={idx}
                className={`w-full transition-colors rounded-t ${
                  height === 100 ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'
                }`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-[#8a7560] uppercase">
            <span>Ene</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Abr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>

        {/* Pedidos diarios globales */}
        <div className="bg-white dark:bg-[#2d2419] p-6 rounded-xl border border-[#e6e0db] dark:border-[#3d3226] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold dark:text-white">Pedidos diarios globales</h4>
              <p className="text-xs text-[#8a7560]">Promedio diario procesado</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">2,984</p>
              <p className="text-[10px] font-bold text-emerald-600">+4.2% promedio diario</p>
            </div>
          </div>
          <div className="h-48 flex flex-col justify-end">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 150">
              <path
                className="stroke-primary fill-none"
                d="M0,100 L40,80 L80,95 L120,60 L160,85 L200,40 L240,70 L280,30 L320,55 L360,20 L400,35"
                strokeWidth="2"
              ></path>
              <circle className="fill-primary" cx="360" cy="20" r="4"></circle>
              <circle className="fill-primary/20" cx="360" cy="20" r="10"></circle>
            </svg>
            <div className="flex justify-between mt-4 text-[10px] font-bold text-[#8a7560] uppercase">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de eventos */}
      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e6e0db] dark:border-[#3d3226] flex items-center justify-between">
          <h4 className="text-base font-bold dark:text-white">Eventos globales críticos</h4>
          <button className="text-xs font-bold text-primary hover:underline">Ver todos los eventos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fcfbf9] dark:bg-[#3d3226] text-[10px] uppercase font-bold text-[#8a7560]">
              <tr>
                <th className="px-6 py-3">Tipo de evento</th>
                <th className="px-6 py-3">Negocio</th>
                <th className="px-6 py-3">Ubicación</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e0db] dark:divide-[#3d3226]">
              {eventos.map((ev) => (
                <tr
                  key={`${ev.tipo}-${ev.tiempo}`}
                  className="text-sm hover:bg-[#f5f2f0] dark:hover:bg-[#3d3226]/70 transition-colors"
                >
                  <td className="px-6 py-4 flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        ev.estadoColor === 'amber'
                          ? 'bg-amber-500'
                          : ev.estadoColor === 'emerald'
                            ? 'bg-emerald-500'
                            : 'bg-primary'
                      }`}
                    ></span>
                    <span className="font-medium dark:text-white">{ev.tipo}</span>
                  </td>
                  <td className="px-6 py-4 text-[#4b5563] dark:text-[#a3907d]">{ev.negocio}</td>
                  <td className="px-6 py-4 text-[#4b5563] dark:text-[#a3907d]">{ev.ubicacion}</td>
                  <td className="px-6 py-4">
                    <EstadoBadge texto={ev.estado} tono={ev.estadoColor} />
                  </td>
                  <td className="px-6 py-4 text-[#8a7560] text-xs">{ev.tiempo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
