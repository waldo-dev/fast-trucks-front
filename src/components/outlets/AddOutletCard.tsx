import React from 'react';

interface AddOutletCardProps {
  onClick: () => void;
}

export const AddOutletCard: React.FC<AddOutletCardProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-primary/5 rounded-2xl border-2 border-dashed border-primary/30 p-5 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-primary/10 transition-all min-h-[250px]"
    >
      <div className="size-14 rounded-full bg-white flex items-center justify-center text-primary shadow-sm mb-4 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-3xl">add</span>
      </div>
      <h3 className="text-lg font-bold text-[#181411]">Expandir Negocio</h3>
      <p className="text-sm text-[#8a7560] mt-1 max-w-[200px]">
        Agrega un nuevo local, food truck o cocina fantasma a tu red.
      </p>
    </div>
  );
};


