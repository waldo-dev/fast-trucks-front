'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PosCambiarEventoPage() {
  const router = useRouter();
  useEffect(() => {
    // La selección de Local + Evento ahora es global (navbar).
    // Mantenemos esta ruta por compatibilidad y redirigimos al POS.
    router.replace('/pos');
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[#8a7560]">
        Redirigiendo… La selección de <span className="font-semibold">Local + Evento</span> ahora vive en el navbar.
      </p>
    </div>
  );
}
