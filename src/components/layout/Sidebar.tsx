'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SIDEBAR_ITEMS, APP_NAME } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';

export const Sidebar = () => {
  const pathname = usePathname();
  const user = getCurrentUser();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-[#e6e0db] bg-white dark:bg-[#2d2419] h-full flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-[#f5f2f0]">
        <div className="bg-primary flex items-center justify-center rounded-lg size-10 text-white">
          <span className="material-symbols-outlined">fastfood</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-[#181411] dark:text-white text-base font-bold leading-tight">
            {APP_NAME}
          </h1>
          <p className="text-[#8a7560] dark:text-[#a3907d] text-xs font-normal">
            Panel Administrador
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-[#4b5563] dark:text-[#a3907d] hover:bg-[#f5f2f0]'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#f5f2f0]">
        <div className="flex items-center gap-3 p-2">
          <div className="size-10 rounded-full border border-[#e6e0db] bg-orange-100 flex items-center justify-center">
            <span className="text-primary font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold dark:text-white">{user.name}</span>
            <span className="text-xs text-[#8a7560]">Administrador</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

