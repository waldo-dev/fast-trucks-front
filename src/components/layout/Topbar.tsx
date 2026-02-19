'use client';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export const Topbar = ({ onToggleSidebar }: TopbarProps) => {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-[#f5f2f0] bg-white/95 dark:bg-[#2d2419]/95 backdrop-blur">
      <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-lg bg-[#f5f2f0] text-[#4b5563] hover:bg-[#ebe8e5] transition-colors"
              onClick={onToggleSidebar}
              aria-label="Abrir menú"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg sm:text-xl font-bold dark:text-white truncate">Resumen del Dashboard</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden sm:inline-flex p-2 rounded-lg bg-[#f5f2f0] text-[#4b5563] relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="hidden sm:inline-flex p-2 rounded-lg bg-[#f5f2f0] text-[#4b5563]">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="bg-primary text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">add</span>
              Nuevo Local
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative w-full sm:w-72 md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7560] text-lg">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-[#f5f2f0] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-[#8a7560]"
              placeholder="Buscar pedidos, locales..."
              type="text"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
