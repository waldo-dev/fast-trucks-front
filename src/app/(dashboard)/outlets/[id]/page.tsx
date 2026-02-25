'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { businessService } from '@/lib/services';

export default function OutletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const outletId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [outlet, setOutlet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!outletId) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await businessService.get(outletId);
        const data = (resp as any)?.data ?? resp;
        setOutlet(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el local');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [outletId]);

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button
          className="flex items-center gap-1 text-primary hover:underline"
          onClick={() => router.back()}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver
        </button>
        <span className="material-symbols-outlined text-[16px] text-gray-300">chevron_right</span>
        <span className="font-semibold text-[#181411]">Detalle de local</span>
      </div>

      <div className="bg-white border border-primary/10 rounded-xl p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando local...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !outlet ? (
          <p className="text-sm text-gray-500">No se encontró el local.</p>
        ) : (
          <div className="space-y-3">
            <h1 className="text-2xl font-black text-[#181411]">{outlet.name || 'Sin nombre'}</h1>
            <p className="text-sm text-gray-600">
              {outlet.brand_name || outlet.address || 'Sin dirección'}
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-700">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                ID: {outlet.id}
              </span>
              {outlet.status && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {String(outlet.status).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

