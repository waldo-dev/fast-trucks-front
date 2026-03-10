'use client';

import { useEffect, useMemo, useState } from 'react';
import { inventoryService } from '@/lib/services';
import { toast } from 'react-toastify';
import { hasFeature } from '@/lib/planAccess';
import { readOperatingContext } from '@/lib/operatingContext';
import { getCachedTier } from '@/lib/planAccess';

type Item = {
  id: string;
  name: string;
  unit: string;
  cost_per_item?: number;
  min_stock?: number;
  current_stock?: number;
  active?: boolean;
};

type Movement = {
  id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason?: string;
  created_at?: string;
};

const formatDate = (value?: string) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export default function InventoryPage() {
  const ctx = readOperatingContext();
  const planTier = (ctx as any)?.planTier || getCachedTier();
  const canSeeInventory = hasFeature('inventory_basic', planTier);

  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [newMovement, setNewMovement] = useState({
    quantity: '',
    movement_type: 'IN' as Movement['movement_type'],
    reason: '',
  });
  const [newItem, setNewItem] = useState({
    name: '',
    unit: '',
    cost_per_item: '',
    min_stock: '',
    active: true,
  });
  const [importing, setImporting] = useState(false);

  const handleImportRecipes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const resp = await inventoryService.importRecipes(file);
      const data = (resp as any)?.data ?? resp;
      const imported = data?.imported ?? 0;
      const errors = data?.errors ?? [];
      if (imported) toast.success(`Recetas importadas: ${imported}`);
      if (errors.length) toast.error(`Errores al importar: ${errors.length}`);
    } catch {
      toast.error('No se pudieron importar las recetas');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const fetchItems = async () => {
    if (!canSeeInventory) return;
    setLoadingItems(true);
    try {
      const resp = await inventoryService.listItems({
        search: search || undefined,
        active: activeOnly ? true : undefined,
      });
      const data = (resp as any)?.data ?? resp;
      if (Array.isArray(data)) {
        setItems(
          data.map((it: any) => ({
            id: String(it.id),
            name: it.name,
            unit: it.unit,
            cost_per_item: it.cost_per_item ? Number(it.cost_per_item) : undefined,
            min_stock: it.min_stock ? Number(it.min_stock) : undefined,
            current_stock: it.current_stock ? Number(it.current_stock) : undefined,
            active: it.active,
          }))
        );
        if (!selectedItemId && data.length) setSelectedItemId(String(data[0].id));
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
      toast.error('No se pudieron cargar los ítems de inventario');
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchMovements = async (itemId?: string) => {
    if (!itemId) return;
    setLoadingMovements(true);
    try {
      const resp = await inventoryService.listMovements(itemId);
      const data = (resp as any)?.data ?? resp;
      if (Array.isArray(data)) {
        setMovements(
          data.map((m: any) => ({
            id: String(m.id),
            movement_type: (m.movement_type || '').toUpperCase(),
            quantity: Number(m.quantity) || 0,
            reason: m.reason,
            created_at: m.created_at || m.createdAt,
          }))
        );
      } else {
        setMovements([]);
      }
    } catch {
      setMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeOnly]);

  useEffect(() => {
    if (selectedItemId) {
      fetchMovements(selectedItemId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId]);

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      toast.error('Selecciona un ítem');
      return;
    }
    const qty = Number(newMovement.quantity);
    if (!Number.isFinite(qty) || qty === 0) {
      toast.error('Cantidad inválida');
      return;
    }
    try {
      await inventoryService.createMovement({
        inventory_item_id: selectedItemId,
        quantity: qty,
        movement_type: newMovement.movement_type,
        reason: newMovement.reason || undefined,
      });
      toast.success('Movimiento registrado');
      setNewMovement({ quantity: '', movement_type: 'IN', reason: '' });
      fetchItems();
      fetchMovements(selectedItemId);
    } catch {
      toast.error('No se pudo registrar el movimiento');
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.unit.trim()) {
      toast.error('Nombre y unidad son obligatorios');
      return;
    }
    try {
      await inventoryService.createItem({
        name: newItem.name.trim(),
        unit: newItem.unit.trim(),
        cost_per_item: newItem.cost_per_item ? Number(newItem.cost_per_item) : undefined,
        min_stock: newItem.min_stock ? Number(newItem.min_stock) : undefined,
        active: newItem.active,
      });
      toast.success('Ítem creado');
      setNewItem({ name: '', unit: '', cost_per_item: '', min_stock: '', active: true });
      fetchItems();
    } catch {
      toast.error('No se pudo crear el ítem');
    }
  };

  const alerts = useMemo(
    () =>
      items
        .filter((s) => s.min_stock !== undefined && s.current_stock !== undefined && s.current_stock <= s.min_stock)
        .map((s) => ({ ...s, status: 'Bajo stock' })),
    [items]
  );

  if (!canSeeInventory) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-2xl font-bold text-[#181411]">Inventario</h1>
        <p className="text-sm text-[#8a7560]">
          Tu plan actual no incluye inventario. Disponible en planes Standard y Pro.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-10 sm:px-0">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
          Gestión de inventario
        </p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Inventario</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Controla stock, movimientos y alertas para tus productos.
        </p>
      </header>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">inventory_2</span>
            <h3 className="text-lg font-bold text-[#181411] dark:text-white">Ítems</h3>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ítem..."
              className="h-10 px-3 rounded-lg border border-primary/20 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-[#4b5563]">
              <input
                type="checkbox"
                className="accent-primary"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
              />
              Solo activos
            </label>
            <label className="flex items-center gap-2 text-sm text-primary cursor-pointer">
              <span className="material-symbols-outlined text-base">upload_file</span>
              <span>{importing ? 'Importando...' : 'Importar recetas'}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportRecipes}
                disabled={importing}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-primary/5 text-[#8a7560] uppercase text-xs tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">Ítem</th>
                    <th className="px-3 py-2 text-left">Unidad</th>
                    <th className="px-3 py-2 text-right">Stock</th>
                    <th className="px-3 py-2 text-right">Mínimo</th>
                    <th className="px-3 py-2 text-right">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {loadingItems ? (
                    <tr>
                      <td className="px-3 py-3 text-[#8a7560]" colSpan={5}>
                        Cargando ítems...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-[#8a7560]" colSpan={5}>
                        No hay ítems para mostrar.
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => {
                      const isAlert =
                        it.min_stock !== undefined &&
                        it.current_stock !== undefined &&
                        it.current_stock <= it.min_stock;
                      return (
                        <tr
                          key={it.id}
                          className={`hover:bg-primary/5 cursor-pointer ${
                            selectedItemId === it.id ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => setSelectedItemId(it.id)}
                        >
                          <td className="px-3 py-2 font-semibold text-[#181411]">{it.name}</td>
                          <td className="px-3 py-2 text-[#4b5563]">{it.unit}</td>
                          <td className="px-3 py-2 text-right font-bold">{it.current_stock ?? '—'}</td>
                          <td className="px-3 py-2 text-right text-[#8a7560]">{it.min_stock ?? '—'}</td>
                          <td className="px-3 py-2 text-right text-[#8a7560]">
                            {it.cost_per_item ? `$${Number(it.cost_per_item).toLocaleString('es-CL')}` : '—'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isAlert && (
                              <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">
                                Bajo stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-[#2d2419] border border-primary/10 rounded-xl p-3 space-y-3 shadow-sm">
            <h4 className="text-sm font-bold text-[#181411]">Nuevo ítem</h4>
            <form className="space-y-2" onSubmit={handleCreateItem}>
              <input
                type="text"
                placeholder="Nombre"
                value={newItem.name}
                onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                className="h-10 px-3 rounded-lg border border-primary/20 text-sm w-full"
              />
              <input
                type="text"
                placeholder="Unidad (ej. kg, unid)"
                value={newItem.unit}
                onChange={(e) => setNewItem((p) => ({ ...p, unit: e.target.value }))}
                className="h-10 px-3 rounded-lg border border-primary/20 text-sm w-full"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Costo/unidad"
                  value={newItem.cost_per_item}
                  onChange={(e) => setNewItem((p) => ({ ...p, cost_per_item: e.target.value }))}
                  className="h-10 px-3 rounded-lg border border-primary/20 text-sm w-full"
                />
                <input
                  type="number"
                  placeholder="Stock mínimo"
                  value={newItem.min_stock}
                  onChange={(e) => setNewItem((p) => ({ ...p, min_stock: e.target.value }))}
                  className="h-10 px-3 rounded-lg border border-primary/20 text-sm w-full"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={newItem.active}
                  onChange={(e) => setNewItem((p) => ({ ...p, active: e.target.checked }))}
                />
                Ítem activo
              </label>
              <button
                type="submit"
                className="w-full h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
              >
                Crear ítem
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold dark:text-white">Movimientos</h3>
            <span className="text-xs text-[#8a7560]">
              {selectedItemId ? 'Mostrando ítem seleccionado' : 'Selecciona un ítem'}
            </span>
          </div>
          {loadingMovements ? (
            <p className="text-sm text-[#8a7560]">Cargando movimientos...</p>
          ) : movements.length === 0 ? (
            <p className="text-sm text-[#8a7560]">No hay movimientos para este ítem.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {movements.map((m) => (
                <li key={m.id} className="flex items-start gap-3 border border-primary/10 rounded-lg p-2">
                  <span
                    className={`material-symbols-outlined text-sm ${
                      m.movement_type === 'IN'
                        ? 'text-green-600'
                        : m.movement_type === 'OUT'
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {m.movement_type === 'IN'
                      ? 'download'
                      : m.movement_type === 'OUT'
                      ? 'upload'
                      : 'sync_problem'}
                  </span>
                  <div className="flex-1">
                    <p className="text-[#181411] dark:text-white font-semibold">
                      {m.movement_type} · {m.quantity}
                    </p>
                    {m.reason && <p className="text-[#4b5563] dark:text-[#a3907d]">{m.reason}</p>}
                    {m.created_at && <p className="text-xs text-[#8a7560]">{formatDate(m.created_at)}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold dark:text-white">Registrar movimiento</h3>
            <span className="text-xs text-[#8a7560]">Afecta stock del ítem seleccionado</span>
          </div>
          <form className="space-y-3" onSubmit={handleCreateMovement}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newMovement.movement_type}
                onChange={(e) =>
                  setNewMovement((p) => ({ ...p, movement_type: e.target.value as Movement['movement_type'] }))
                }
                className="h-10 px-3 rounded-lg border border-primary/20 text-sm"
              >
                <option value="IN">Entrada</option>
                <option value="OUT">Salida</option>
                <option value="ADJUST">Ajuste</option>
              </select>
              <input
                type="number"
                value={newMovement.quantity}
                onChange={(e) => setNewMovement((p) => ({ ...p, quantity: e.target.value }))}
                placeholder="Cantidad"
                className="h-10 px-3 rounded-lg border border-primary/20 text-sm"
              />
              <input
                type="text"
                value={newMovement.reason}
                onChange={(e) => setNewMovement((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Motivo (opcional)"
                className="h-10 px-3 rounded-lg border border-primary/20 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
            >
              Registrar movimiento
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold dark:text-white">Alertas</h3>
          <span className="text-xs text-[#8a7560]">Basado en stock actual vs mínimo</span>
        </div>
        {alerts.length === 0 ? (
          <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">Sin alertas por ahora.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 text-sm">warning</span>
                <div>
                  <p className="text-[#181411] dark:text-white font-semibold">{a.name}</p>
                  <p className="text-[#4b5563] dark:text-[#a3907d]">
                    Stock {a.current_stock ?? '—'} / mínimo {a.min_stock ?? '—'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}