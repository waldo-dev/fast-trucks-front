'use client';

import React, { useState } from 'react';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: sin acción real
  };

  return (
    <div className="w-full max-w-md flex flex-col">
      {/* Mobile Branding */}
      <div className="flex items-center gap-2 mb-10 md:hidden">
        <div className="bg-primary p-1.5 rounded-lg text-white">
          <span className="material-symbols-outlined text-2xl">restaurant</span>
        </div>
        <span className="text-[#181411] dark:text-white text-xl font-bold tracking-tight">
          FoodSaaS
        </span>
      </div>

      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-[#181411] dark:text-white mb-2">
          ¡Bienvenido de nuevo, Chef!
        </h2>
        <p className="text-[#8a7560] dark:text-[#a09080]">
          Ingresa tus credenciales para acceder a tu panel
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-semibold text-[#181411] dark:text-white ml-1"
            htmlFor="email"
          >
            Correo Electrónico
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7560] text-xl">
              mail
            </span>
            <input
              className="w-full pl-12 pr-4 h-14 bg-white dark:bg-[#2d2218] border border-[#e6e0db] dark:border-[#3d332a] rounded-xl text-[#181411] dark:text-white placeholder:text-[#8a7560] focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              id="email"
              placeholder="chef@pizzeria.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center ml-1">
            <label
              className="text-sm font-semibold text-[#181411] dark:text-white"
              htmlFor="password"
            >
              Contraseña
            </label>
            <a className="text-xs font-bold text-primary hover:underline" href="#">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7560] text-xl">
              lock
            </span>
            <input
              className="w-full pl-12 pr-12 h-14 bg-white dark:bg-[#2d2218] border border-[#e6e0db] dark:border-[#3d332a] rounded-xl text-[#181411] dark:text-white placeholder:text-[#8a7560] focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              id="password"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a7560] hover:text-primary transition-colors"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center px-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              className="h-5 w-5 rounded border-[#e6e0db] dark:border-[#3d332a] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 transition-colors"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="text-sm font-medium text-[#181411] dark:text-white group-hover:text-primary transition-colors">
              Mantener sesión iniciada
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
          type="submit"
        >
          Iniciar Sesión en el Panel
          <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </form>

      {/* Footer Links */}
      <div className="mt-12 text-center">
        <p className="text-[#8a7560] dark:text-[#a09080]">
          ¿Aún no tienes una cuenta?{' '}
          <a className="text-primary font-bold hover:underline ml-1" href="#">
            Únete a la red
          </a>
        </p>
      </div>

      {/* Subtle Brand Footer */}
      <div className="mt-auto pt-10 flex justify-center items-center gap-4 text-[#8a7560] text-[10px] uppercase tracking-[0.2em]">
        <span>© 2024 FoodSaaS Inc.</span>
        <span className="h-1 w-1 rounded-full bg-[#8a7560]"></span>
        <a className="hover:text-primary transition-colors" href="#">
          Política de Privacidad
        </a>
        <span className="h-1 w-1 rounded-full bg-[#8a7560]"></span>
        <a className="hover:text-primary transition-colors" href="#">
          Soporte
        </a>
      </div>
    </div>
  );
};

