import React from 'react';
import Image from 'next/image';

export const LoginHero = () => {
  return (
    <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://firebasestorage.googleapis.com/v0/b/fast-trucks.firebasestorage.app/o/tablet-dashboard.jpeg?alt=media&token=9f74e362-b403-45ed-a3cc-34bf860d8742')",
        }}
      />
      <div className="absolute inset-0 food-overlay flex flex-col justify-end p-12 lg:p-20">
        <div className="max-w-xl">
        <div className="flex items-center gap-2 mb-6">
          <Image
            src="/logo-operfoods-4.svg"
            alt="Operfoods"
            width={240}
            height={240}
            className="rounded-md"
            priority
          />
        </div>
          <h1 className="text-white text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
            Gestiona tu sabor, en cualquier lugar.
          </h1>
          <p className="text-white/90 text-lg lg:text-xl font-medium max-w-md">
            El panel centralizado para negocios gastronómicos modernos, desde food trucks hasta
            franquicias.
          </p>
        </div>
      </div>
    </div>
  );
};








