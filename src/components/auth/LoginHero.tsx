import React from 'react';

export const LoginHero = () => {
  return (
    <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCsL4ic0G6cFsoA5RAE6Da8YYSeVhcy32-QwzdeMXtRwzhCjHjw6g3wzhx013kw6JZ0r-4wL74pbLyq1tIEteC5LT4xTrp9eTnIQP5UyGE3vJK7JSjROD54lFQDeYmWtJMrzLiN2S41FUozZx7ta-INI7XLRnxAknzL-GsqLQDe_OXFg5KZiXkqzwagUqBD2CI-nFzppOVLsOPCOJ58z7C6TsUG3XAw7LfpHkEUaO2GKDWFESgqxBfoI3LUjh4te4RbKgY3igHXruiX')",
        }}
      />
      <div className="absolute inset-0 food-overlay flex flex-col justify-end p-12 lg:p-20">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-primary p-2 rounded-lg text-white">
              <span className="material-symbols-outlined text-3xl">restaurant</span>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Fast Trucks</span>
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





