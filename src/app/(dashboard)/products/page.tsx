'use client';

import { useEffect, useState } from 'react';
import { businessService, categoryService, productService } from '@/lib/services';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductTable } from '@/components/products/ProductTable';

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [products, setProducts] = useState<
    Array<{
      id: number;
      name: string;
      sku: string;
      image: string;
      venue: { name: string; location: string };
      category: { name: string; icon: string };
      price: string;
      status: 'active' | 'paused' | 'draft';
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [venues, setVenues] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; icon?: string; count?: number }>
  >([]);
  const [categoryVenues, setCategoryVenues] = useState<string[]>([]);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    status: 'active' as 'active' | 'paused' | 'draft',
    options: '',
    image: null as File | null,
  });
  const [productVenues, setProductVenues] = useState<string[]>([]);

  const loadCategories = async () => {
    try {
      const resp = await categoryService.listByOwner();
      const list = (resp as any)?.data ?? resp;
      const mapped =
        Array.isArray(list) && list.length
          ? [{ id: '', name: 'Todas', icon: 'category' }].concat(
              list.map((cat: any) => ({
                id: String(cat.id),
                name: cat.name || 'Sin nombre',
                icon: 'category',
              }))
            )
          : [{ id: '', name: 'Todas', icon: 'category' }];
      setCategories(mapped);
    } catch {
      setCategories([{ id: '', name: 'Todas', icon: 'category' }]);
    }
  };

  const handleEdit = (id: number) => {
    // Placeholder: sin acción real
    console.log('Editar producto:', id);
  };

  const handleViewDetails = (id: number) => {
    // Placeholder: sin acción real
    console.log('Ver detalles producto:', id);
  };

  const handleAddProduct = () => {
    setShowProductModal(true);
    setProductError(null);
  };

  const handleExport = () => {
    // Placeholder: sin acción real
    console.log('Exportar');
  };

  const handleSync = () => {
    // Placeholder: sin acción real
    console.log('Sincronizar');
  };

  useEffect(() => {
    const loadVenues = async () => {
      try {
        const resp = await businessService.list();
        const list = (resp as any)?.data ?? resp;
        const mapped =
          Array.isArray(list) && list.length
            ? [{ id: '', name: 'Todos los Locales' }].concat(
                list.map((biz: any) => ({
                  id: String(biz.id),
                  name: biz.name || biz.brand_name || 'Sin nombre',
                }))
              )
            : [{ id: '', name: 'Todos los Locales' }];
        setVenues(mapped);
        const selectable = mapped.filter((v) => v.id !== '');
        if (selectable.length === 1) {
          setCategoryVenues([selectable[0].id]);
        }
      } catch {
        setVenues([{ id: '', name: 'Todos los Locales' }]);
        setProductVenues([]);
      }
    };
    loadVenues();
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const resp = await productService.listByOwner({
        business_id: selectedVenue || undefined,
        category_id: selectedCategory || undefined,
        status: selectedStatus || undefined,
      });
      const list = (resp as any)?.data ?? resp;
      if (Array.isArray(list)) {
        const mapped = list.map((p: any) => ({
          id: Number(p.id) || Math.random(),
          name: p.name || 'Sin nombre',
          sku: p.sku || 'N/A',
          image:
            p.image ||
            'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
          venue: {
            name: p.venue?.name || 'Sin local',
            location: p.venue?.location ?? 'Sin ubicación',
          },
          category: {
            name: p.category?.name || 'Sin categoría',
            icon: p.category?.icon || 'restaurant',
          },
          price: p.price ? `$${p.price}` : '$0.00',
          status:
            p.status === 'paused' || p.status === 'draft' ? p.status : 'active',
        }));
        setProducts(mapped);
      } else {
        setProducts([]);
      }
    } catch (e) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedVenue, selectedCategory, selectedStatus]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-primary/10 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Global</span>
          <span className="material-symbols-outlined text-[16px] text-gray-300">chevron_right</span>
          <span className="font-semibold">Productos</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-background-light border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
              placeholder="Buscar producto o SKU..."
              type="text"
            />
          </div>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Agregar Nuevo Producto
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 bg-white text-primary border border-primary/30 hover:bg-primary/5 px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">category</span>
            Nueva Categoría
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Filters Sidebar */}
        <ProductFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedVenue={selectedVenue}
          onVenueChange={setSelectedVenue}
          venues={venues}
          categories={categories}
        />

        {/* Data Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-background-light">
          <div className="flex flex-col gap-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#181411]">Catálogo Global de Productos</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Gestiona 59 productos en 4 locales activos.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="p-2 bg-white border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-gray-600">file_download</span>
                </button>
                <button
                  onClick={handleSync}
                  className="p-2 bg-white border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-gray-600">sync</span>
                </button>
              </div>
            </div>

            {/* Table Container */}
            {loading ? (
              <div className="bg-white border border-primary/10 rounded-xl p-6 text-sm text-gray-500">
                Cargando productos...
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white border border-dashed border-primary/20 rounded-xl p-6 text-sm text-gray-500 flex items-center justify-between">
                <span>No hay productos disponibles.</span>
                <button
                  onClick={handleAddProduct}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Agregar producto
                </button>
              </div>
            ) : (
              <ProductTable
                products={products}
                onEdit={handleEdit}
                onViewDetails={handleViewDetails}
              />
            )}
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => {
                setShowCategoryModal(false);
                setNewCategory('');
              }}
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-[#181411] mb-2">Crear nueva categoría</h3>
            <p className="text-sm text-gray-500 mb-4">Ingresa el nombre de la categoría.</p>
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCategory.trim()) return;
                const businessIds = categoryVenues
                  .map((id) => Number(id))
                  .filter((id) => !Number.isNaN(id));
                if (businessIds.length === 0) {
                  setCategoryError('Selecciona al menos un local para asociar la categoría.');
                  return;
                }
                setSavingCategory(true);
                setCategoryError(null);
                try {
                  if (businessIds.length > 1) {
                    await categoryService.createBulk({
                      name: newCategory.trim(),
                      business_ids: businessIds,
                    });
                  } else {
                    const resp = await categoryService.create({
                      name: newCategory.trim(),
                      business_id: businessIds[0],
                    });
                    const created = (resp as any)?.data ?? resp;
                    const newItem = {
                      id: String(created?.id || Math.random()),
                      name: created?.name || newCategory.trim(),
                      icon: 'category',
                    };
                    setCategories((prev) => {
                      const filtered = prev.filter((c) => c.id !== newItem.id);
                      return [
                        { id: '', name: 'Todas', icon: 'category' },
                        ...filtered.filter((c) => c.id !== ''),
                        newItem,
                      ];
                    });
                  }
                  setShowCategoryModal(false);
                  setNewCategory('');
                  setCategoryVenues(
                    venues.filter((v) => v.id !== '').length === 1
                      ? [venues.find((v) => v.id !== '')?.id || '']
                      : []
                  );
                  // Reload categories to reflect server state
                  await loadCategories();
                } catch (err) {
                  setCategoryError(
                    err instanceof Error ? err.message : 'No se pudo crear la categoría'
                  );
                } finally {
                  setSavingCategory(false);
                }
              }}
            >
              <input
                className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ej. Bebidas"
                required
              />
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">Asociar a locales</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {venues
                    .filter((v) => v.id !== '')
                    .map((v) => {
                      const checked = categoryVenues.includes(v.id);
                      return (
                        <label
                          key={v.id}
                          className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:border-primary/40"
                        >
                          <input
                            type="checkbox"
                            className="text-primary border-gray-300 rounded focus:ring-primary"
                            checked={checked}
                            onChange={() =>
                              setCategoryVenues((prev) =>
                                checked ? prev.filter((id) => id !== v.id) : [...prev, v.id]
                              )
                            }
                          />
                          <span className="text-sm text-gray-700">{v.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
              {categoryError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {categoryError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategory('');
                    setCategoryError(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingCategory ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-2xl p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => {
                setShowProductModal(false);
                setProductError(null);
                setProductForm({
                  name: '',
                  description: '',
                  price: '',
                  category_id: '',
                  status: 'active',
                  options: '',
                  image: null,
                });
                setProductVenues(
                  venues.filter((v) => v.id !== '').length === 1
                    ? [venues.find((v) => v.id !== '')?.id || '']
                    : []
                );
              }}
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-[#181411] mb-2">Crear nuevo producto</h3>
            <p className="text-sm text-gray-500 mb-4">Completa los datos y sube una imagen (opcional).</p>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setProductError(null);
                if (!productForm.name || !productForm.price || !productForm.category_id) {
                  setProductError('Nombre, precio y categoría son obligatorios');
                  return;
                }
                const businessIds = productVenues
                  .map((id) => Number(id))
                  .filter((id) => !Number.isNaN(id));
                if (businessIds.length === 0 && venues.filter((v) => v.id !== '').length > 0) {
                  setProductError('Selecciona al menos un local para asociar el producto.');
                  return;
                }
                setProductSaving(true);
                try {
                  if (businessIds.length > 1) {
                    await productService.createBulkWithImage({
                      name: productForm.name,
                      description: productForm.description || undefined,
                      price: productForm.price,
                      category_id: productForm.category_id,
                      status: productForm.status,
                      options: productForm.options || undefined,
                      business_ids: businessIds,
                      image: productForm.image || undefined,
                    });
                  } else {
                    await productService.createWithImage({
                      name: productForm.name,
                      description: productForm.description || undefined,
                      price: productForm.price,
                      category_id: productForm.category_id,
                      status: productForm.status,
                      options: productForm.options || undefined,
                      business_id: businessIds[0],
                      image: productForm.image || undefined,
                    });
                  }
                  setShowProductModal(false);
                  setProductForm({
                    name: '',
                    description: '',
                    price: '',
                    category_id: '',
                    status: 'active',
                    options: '',
                    image: null,
                  });
                  setProductVenues(
                    venues.filter((v) => v.id !== '').length === 1
                      ? [venues.find((v) => v.id !== '')?.id || '']
                      : []
                  );
                  await loadProducts();
                } catch (err) {
                  setProductError(
                    err instanceof Error ? err.message : 'No se pudo crear el producto'
                  );
                } finally {
                  setProductSaving(false);
                }
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Nombre</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={productForm.name}
                  onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Precio</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-[#181411]">Descripción</label>
                <textarea
                  className="min-h-[80px] rounded-lg border border-primary/20 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={productForm.description}
                  onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Categoría</label>
                <select
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={productForm.category_id}
                  onChange={(e) => setProductForm((p) => ({ ...p, category_id: e.target.value }))}
                  required
                >
                  <option value="">Selecciona...</option>
                  {categories
                    .filter((c) => c.id !== '')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Estado</label>
                <select
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={productForm.status}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, status: e.target.value as 'active' | 'paused' | 'draft' }))
                  }
                >
                  <option value="active">Activo</option>
                  <option value="paused">Pausado</option>
                  <option value="draft">Borrador</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-[#181411]">Asociar a locales</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {venues
                    .filter((v) => v.id !== '')
                    .map((v) => {
                      const checked = productVenues.includes(v.id);
                      return (
                        <label
                          key={v.id}
                          className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:border-primary/40"
                        >
                          <input
                            type="checkbox"
                            className="text-primary border-gray-300 rounded focus:ring-primary"
                            checked={checked}
                            onChange={() =>
                              setProductVenues((prev) =>
                                checked ? prev.filter((id) => id !== v.id) : [...prev, v.id]
                              )
                            }
                          />
                          <span className="text-sm text-gray-700">{v.name}</span>
                        </label>
                      );
                    })}
                  {venues.filter((v) => v.id !== '').length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setProductVenues(
                          productVenues.length === venues.filter((v) => v.id !== '').length
                            ? []
                            : venues.filter((v) => v.id !== '').map((v) => v.id)
                        )
                      }
                      className="col-span-1 sm:col-span-2 text-xs font-semibold text-primary hover:underline text-left"
                    >
                      {productVenues.length === venues.filter((v) => v.id !== '').length
                        ? 'Quitar selección'
                        : 'Seleccionar todos'}
                    </button>
                  )}
                </div>
              </div>
              {/*<div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-[#181411]">Opciones (JSON opcional)</label>
                <textarea
                  className="min-h-[80px] rounded-lg border border-primary/20 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  placeholder='Ej: [{"name":"Tamaño","values":["S","M","L"]}]'
                  value={productForm.options}
                  onChange={(e) => setProductForm((p) => ({ ...p, options: e.target.value }))}
                />
              </div>*/}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-[#181411]">Imagen (archivo)</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm file:mr-3 file:py-2 file:px-3 file:border-0 file:rounded-md file:bg-primary file:text-white"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, image: e.target.files?.[0] || null }))
                  }
                />
              </div>
              {productError && (
                <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {productError}
                </div>
              )}
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setProductError(null);
                    setProductForm({
                      name: '',
                      description: '',
                      price: '',
                      category_id: '',
                      status: 'active',
                      options: '',
                      image: null,
                    });
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={productSaving}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {productSaving ? 'Guardando...' : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

