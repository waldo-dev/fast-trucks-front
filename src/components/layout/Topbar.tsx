'use client';

export const Topbar = () => {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white dark:bg-[#2d2419] border-b border-[#f5f2f0] sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold dark:text-white">Resumen del Dashboard</h2>
        <div className="relative w-64">
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
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg bg-[#f5f2f0] text-[#4b5563] relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="p-2 rounded-lg bg-[#f5f2f0] text-[#4b5563]">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="h-8 w-px bg-[#e6e0db] mx-2"></div>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-base">add</span>
          Nuevo Local
        </button>
      </div>
    </header>
  );
};

