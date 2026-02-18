import React from 'react';

export const StatsFooter = () => {
  return (
    <footer className="bg-white border-t border-[#e6e0db] py-3 px-10 flex justify-between items-center text-[#8a7560] text-xs font-semibold">
      <div className="flex gap-6">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-green-500"></span> API: Conectado
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-green-500"></span> DB: Saludable
        </span>
      </div>
      <div>© 2024 FastDash SaaS. Todos los derechos reservados.</div>
    </footer>
  );
};



