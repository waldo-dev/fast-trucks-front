'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Histórico unificado en /orders (módulo Pedidos). */
export default function PosHistorialRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/orders');
  }, [router]);
  return (
    <p className="text-sm text-[#8a7560]">
      Redirigiendo a Pedidos…
    </p>
  );
}
