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
  const [productLoading, setProductLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    setProductError(null);
    setProductLoading(true);
    setShowProductModal(true);
    setEditingProductId(id);
    productService
      .get(id)
      .then((resp: any) => {
        const data = resp?.data ?? resp;
        setProductForm({
          name: data?.name || '',
          description: data?.description || '',
          price: data?.price ? String(data.price) : '',
          category_id: data?.category_id ? String(data.category_id) : '',
          status: (data?.status as 'active' | 'paused' | 'draft') || 'active',
          options: data?.options || '',
          image: null,
        });
        const bizIds: string[] = Array.isArray(data?.business_ids)
          ? data.business_ids.map((b: any) => String(b))
          : data?.business_id
          ? [String(data.business_id)]
          : [];
        setProductVenues(bizIds);
      })
      .catch((err: any) => {
        setProductError(
          err instanceof Error ? err.message : 'No se pudo cargar el producto'
        );
      })
      .finally(() => setProductLoading(false));
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
            p.image_url ||
            'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
          venue: {
            name: p.business?.name || p.venue?.name || 'Sin local',
            location:
              p.business?.location ||
              p.venue?.location ||
              p.business?.address ||
              'Sin ubicación',
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

  const displayedProducts = products.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.category.name.toLowerCase().includes(term) ||
      p.venue.name.toLowerCase().includes(term)
    );
  });

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const pausedDraft = products.filter((p) => p.status !== 'active').length;
  const categoriesCount = categories.filter((c) => c.id !== '').length;

  const statusBadge = (status: string) => {
    if (status === 'active')
      return (
        <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
          Activo
        </span>
      );
    if (status === 'paused')
      return (
        <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
          Pausado
        </span>
      );
    return (
      <span className="px-2.5 py-1 text-xs font-semibold bg-slate-200 text-slate-700 rounded-full">
        Borrador
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light">
      {/* Top Header */}
      <header className="bg-white border-b border-primary/10 px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary font-semibold">
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            <span>Inventario</span>
          </div>
          <h1 className="text-2xl font-black text-[#181411]">Catálogo de productos</h1>
          <p className="text-gray-500 text-sm">
            Gestiona tus productos, categorías y locales asociados.
          </p>
        </div>
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
          <div className="relative group w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-background-light border border-primary/20 rounded-lg text-sm w-full focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
              placeholder="Buscar por nombre, SKU o categoría..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-primary/20 w-full sm:w-auto justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nuevo producto
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 bg-white text-primary border border-primary/30 hover:bg-primary/5 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-sm w-full sm:w-auto justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">category</span>
            Nueva categoría
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Data Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="flex flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Total productos</span>
                  <span className="material-symbols-outlined text-primary">inventory</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#181411]">{totalProducts}</span>
                  <span className="text-xs text-gray-500">registrados</span>
                </div>
              </div>
              <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Activos</span>
                  <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#181411]">{activeProducts}</span>
                  <span className="text-xs text-emerald-600 font-medium">publicados</span>
                </div>
              </div>
              <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Pausados/Borrador</span>
                  <span className="material-symbols-outlined text-amber-500">pending</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#181411]">{pausedDraft}</span>
                  <span className="text-xs text-amber-600 font-medium">revisar</span>
                </div>
              </div>
              <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Categorías</span>
                  <span className="material-symbols-outlined text-purple-500">category</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#181411]">{categoriesCount}</span>
                  <span className="text-xs text-gray-500">activas</span>
                </div>
              </div>
            </div>

            {/* Header actions */}
            <div className="bg-white border border-primary/10 rounded-xl shadow-sm">
              <div className="p-4 border-b border-primary/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-600">list_alt</span>
                  <h2 className="text-lg font-bold text-[#181411]">Listado de productos</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFiltersOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 text-sm font-semibold text-primary bg-white hover:bg-primary/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">filter_alt</span>
                    Filtros
                  </button>
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
                <div className="p-6 text-sm text-gray-500">Cargando productos...</div>
              ) : displayedProducts.length === 0 ? (
                <div className="p-6 text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span>No hay productos disponibles con los filtros actuales.</span>
                  <button
                    onClick={handleAddProduct}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-primary/20 w-full sm:w-auto justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Agregar producto
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-[0.06em]">
                          <th className="px-6 py-4">Producto</th>
                          <th className="px-6 py-4">Categoría</th>
                          <th className="px-6 py-4">Local</th>
                          <th className="px-6 py-4">Precio</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-[#181411]">{p.name}</div>
                                  <div className="text-xs text-slate-500">SKU: {p.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#181411]">{p.category.name}</td>
                            <td className="px-6 py-4 text-sm text-[#181411]">{p.venue.name}</td>
                            <td className="px-6 py-4 text-sm font-medium text-[#181411]">{p.price}</td>
                            <td className="px-6 py-4">{statusBadge(p.status)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                  onClick={() => handleEdit(p.id)}
                                >
                                  <span className="material-symbols-outlined text-xl">edit</span>
                                </button>
                                <button
                                  className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                  onClick={() => handleViewDetails(p.id)}
                                >
                                  <span className="material-symbols-outlined text-xl">visibility</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-500">
                    Mostrando {displayedProducts.length} de {products.length} productos
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => {
            setShowCategoryModal(false);
            setNewCategory('');
            setCategoryError(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
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
            setEditingProductId(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
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
                setEditingProductId(null);
                setProductLoading(false);
              }}
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-[#181411] mb-2">
              {editingProductId ? 'Editar producto' : 'Crear nuevo producto'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Completa los datos y sube una imagen (opcional).
            </p>
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
                  if (editingProductId) {
                    await productService.update(editingProductId, {
                      name: productForm.name,
                      description: productForm.description || undefined,
                      price: productForm.price,
                      category_id: productForm.category_id,
                      status: productForm.status,
                      options: productForm.options || undefined,
                      business_ids: businessIds,
                    });
                  } else {
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
                  setEditingProductId(null);
                  setProductLoading(false);
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
              {productLoading && (
                <div className="md:col-span-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  Cargando información del producto...
                </div>
              )}
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

      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-md max-h-[80vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => setFiltersOpen(false)}
              aria-label="Cerrar filtros"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <ProductFilters
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedVenue={selectedVenue}
              onVenueChange={setSelectedVenue}
              venues={venues}
              categories={categories}
              className="w-full h-[80vh] max-h-[80vh] border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}

