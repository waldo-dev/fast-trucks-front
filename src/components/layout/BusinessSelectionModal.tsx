'use client';

import { useMemo, useState } from 'react';
import { useDashboardNavigation } from './useDashboardNavigation';

/**
 * Modal de selección de Local (business) para establecer contexto post-login.
 * Se muestra sólo si el usuario no es ADMIN y no hay business_id en el contexto.
 */
export function BusinessSelectionModal() {
  const {
    businesses,
    loadingBiz,
    needsBusinessSelection,
    operatingContext,
    handleSelectBusiness,
    isAdmin,
  } = useDashboardNavigation();
  const [selectedId, setSelectedId] = useState<string>('');

  const effectiveSelected = useMemo(() => {
    if (selectedId) return selectedId;
    if (operatingContext?.type === 'business' && operatingContext.business_id) {
      return String(operatingContext.business_id);
    }
    return businesses[0]?.id ?? '';
  }, [selectedId, operatingContext, businesses]);

  if (isAdmin) return null;
  if (!needsBusinessSelection) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-[#181411] dark:text-white">Selecciona un local</h3>
          <p className="text-sm text-[#8a7560] dark:text-[#a3907d]">
            Necesitamos un local activo para iniciar el panel.
          </p>
        </div>

        <div className="space-y-2">
          <label className="sr-only" htmlFor="business-selection-modal">
            Local
          </label>
          <select
            id="business-selection-modal"
            className="w-full h-11 rounded-lg border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] px-3 text-sm"
            value={effectiveSelected}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={loadingBiz}
          >
            <option value="" disabled>
              {loadingBiz ? 'Cargando...' : 'Selecciona un local'}
            </option>
            {!loadingBiz && businesses.length === 0 && <option>No hay locales</option>}
            {!loadingBiz &&
              businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => effectiveSelected && handleSelectBusiness(effectiveSelected)}
            disabled={loadingBiz || !effectiveSelected}
            className="px-4 h-10 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

