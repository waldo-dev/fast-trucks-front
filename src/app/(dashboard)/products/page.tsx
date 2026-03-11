'use client';

import { useEffect, useMemo, useState } from 'react';
import { businessService, categoryService, productService } from '@/lib/services';
import { readOperatingContext } from '@/lib/operatingContext';
import { toast } from 'react-toastify';
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
      venue: { id?: string; name: string; location: string };
      category: { name: string; icon: string };
      price: string;
      status: 'active' | 'paused' | 'draft' | 'inactive';
      businessId?: string;
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
  const [confirmProduct, setConfirmProduct] = useState<{
    id: number;
    name: string;
    status: string;
    businessId?: string;
  } | null>(null);
  const [editCategory, setEditCategory] = useState<{ id: string; name: string } | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [savingCategoryEdit, setSavingCategoryEdit] = useState(false);
  const [confirmCategory, setConfirmCategory] = useState<{ id: string; name: string } | null>(
    null
  );
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [showCategoriesList, setShowCategoriesList] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    category_id: '',
    status: 'active' as 'active' | 'paused' | 'draft',
    options: '',
    image: null as File | null,
  });
  const [productVenues, setProductVenues] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadCategories = async () => {
    try {
      const ctx = readOperatingContext();
      const ctxBusinessId = ctx?.type === 'business' ? ctx.business_id : undefined;
      const resp = await categoryService.listByOwner({
        business_id: ctxBusinessId || undefined,
      });
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
          sku: data?.sku || '',
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
    const hasCategories = categories.some((c) => c.id !== '');
    if (!hasCategories) {
      setShowCategoryModal(true);
      setCategoryError('Primero crea una categoría para asociar el producto.');
      return;
    }
    setShowProductModal(true);
    setProductError(null);
  };

  const handleSync = () => {
    // Placeholder: sin acción real
    console.log('Sincronizar');
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportError('Selecciona un archivo CSV.');
      toast.error('Selecciona un archivo CSV.');
      return;
    }
    setImporting(true);
    setImportError(null);
    setImportSummary(null);
    const params = {
      business_id: selectedVenue || undefined,
    };
    try {
      const resp: any = await toast.promise(
        productService.importOwner(importFile, params),
        {
          pending: 'Importando productos...',
          success: 'Importación completada',
          error: 'No se pudo importar el CSV',
        }
      );
      // resp puede contener resultados por fila
      if (Array.isArray(resp)) {
        const ok = resp.filter((r: any) => r.product).length;
        const fail = resp.filter((r: any) => r.error).length;
        setImportSummary(`Filas procesadas: ${resp.length}. Éxitos: ${ok}. Errores: ${fail}.`);
      } else {
        setImportSummary('Importación finalizada.');
      }
      await loadProducts();
      setImportFile(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al importar CSV');
    } finally {
      setImporting(false);
      setShowImportModal(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const params = {
      business_id: selectedVenue || undefined,
      category_id: selectedCategory || undefined,
      status: selectedStatus || undefined,
    };
    try {
      const blob = await toast.promise(productService.exportOwner(params), {
        pending: 'Generando CSV...',
        success: 'Exportación lista',
        error: 'No se pudo exportar productos',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'productos.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setExporting(false);
      setShowExportConfirm(false);
    }
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
      const ctx = readOperatingContext();
      const ctxBusinessId = ctx?.type === 'business' ? ctx.business_id : undefined;
      const resp = await productService.listByOwner({
        business_id: selectedVenue || ctxBusinessId || undefined,
        category_id: selectedCategory || undefined,
        status: selectedStatus || undefined,
      });
      const list = (resp as any)?.data ?? resp;
      if (Array.isArray(list)) {
        const mapped = list.map((p: any) => ({
          id: Number(p.id) || Math.random(),
          name: p.name || 'Sin nombre',
          image:
            p.image ||
            p.image_url ||
            'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
          venue: {
            id:
              p.business?.id !== undefined
                ? String(p.business.id)
                : p.business_id !== undefined
                ? String(p.business_id)
                : p.venue?.id !== undefined
                ? String(p.venue.id)
                : undefined,
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
          sku: p.sku || 'N/A',
          status:
            p.status === 'paused' || p.status === 'draft' || p.status === 'inactive'
              ? p.status
              : 'active',
          businessId:
            p.business?.id !== undefined
              ? String(p.business.id)
              : p.business_id !== undefined
              ? String(p.business_id)
              : undefined,
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
    const ctx = readOperatingContext();
    if (!selectedVenue && ctx?.type === 'business' && ctx.business_id) {
      setSelectedVenue(String(ctx.business_id));
    }
    loadProducts();
  }, [selectedVenue, selectedCategory, selectedStatus]);

  useEffect(() => {
    setPage(1);
  }, [selectedVenue, selectedCategory, selectedStatus, searchTerm, products]);

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

  const totalPages = Math.max(1, Math.ceil(displayedProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedProducts.slice(start, start + pageSize);
  }, [displayedProducts, currentPage]);

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const pausedDraft = products.filter((p) => p.status !== 'active').length;
  const categoriesCount = categories.filter((c) => c.id !== '').length;
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

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

  const resolveBusinessId = () => {
    return (
      selectedVenue ||
      categoryVenues[0] ||
      venues.find((v) => v.id !== '')?.id ||
      ''
    );
  };

  const handleToggleStatus = async (
    productId: number,
    currentStatus: string,
    businessId?: string
  ) => {
    const targetStatus = currentStatus === 'inactive' ? 'ACTIVE' : 'INACTIVE';
    const businessParam = selectedVenue || businessId;
    if (targetStatus === 'INACTIVE' && !businessParam) {
      toast.error('Selecciona un local para eliminar el producto.');
      return;
    }
    setUpdatingStatusId(productId);
    try {
      await toast.promise(
        productService.updateStatus(productId, { status: targetStatus }, { business_id: businessParam }),
        {
          pending:
            targetStatus === 'INACTIVE' ? 'Eliminando producto...' : 'Activando producto...',
          success: targetStatus === 'INACTIVE' ? 'Producto eliminado' : 'Producto activado',
          error: 'No se pudo actualizar el estado',
        }
      );
      await loadProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar estado');
    } finally {
      setUpdatingStatusId(null);
    }
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
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-white text-[#181411] border border-primary/30 hover:bg-primary/5 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 shadow-sm w-full sm:w-auto justify-center"
            title="Importar productos desde CSV"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">upload</span>
            Importar productos
          </button>
          <button
            onClick={() => setShowCategoriesList(true)}
            className="flex items-center gap-2 bg-white text-[#181411] border border-slate-200 hover:bg-slate-50 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 shadow-sm w-full sm:w-auto justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">list</span>
            Ver categorías
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
                    onClick={() => setShowExportConfirm(true)}
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
                  <span>
                    {categoriesCount === 0
                      ? 'No hay categorías creadas. Crea una categoría para poder agregar productos.'
                      : 'No hay productos disponibles con los filtros actuales.'}
                  </span>
                  <button
                    onClick={categoriesCount === 0 ? () => setShowCategoryModal(true) : handleAddProduct}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-primary/20 w-full sm:w-auto justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {categoriesCount === 0 ? 'category' : 'add'}
                    </span>
                    {categoriesCount === 0 ? 'Crear categoría' : 'Agregar producto'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
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
                        {paginatedProducts.map((p) => (
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
                                <button
                                  className={`p-1.5 ${
                                    p.status === 'inactive'
                                      ? 'text-emerald-600 hover:text-emerald-700'
                                      : 'text-red-500 hover:text-red-600'
                                  } transition-colors disabled:opacity-60`}
                                  onClick={() => {
                                    if (p.status === 'inactive') {
                                      handleToggleStatus(p.id, p.status, p.businessId || p.venue.id);
                                    } else {
                                      setConfirmProduct({
                                        id: p.id,
                                        name: p.name,
                                        status: p.status,
                                        businessId: p.businessId || p.venue.id,
                                      });
                                    }
                                  }}
                                  disabled={updatingStatusId === p.id}
                                  title={p.status === 'inactive' ? 'Activar' : 'Eliminar'}
                                >
                                  <span className="material-symbols-outlined text-xl">
                                    {p.status === 'inactive' ? 'restart_alt' : 'delete'}
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: tarjetas */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {paginatedProducts.map((p) => (
                      <div key={p.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="font-semibold text-[#181411]">{p.name}</div>
                              <div className="text-xs text-slate-500">SKU: {p.sku}</div>
                              <div className="text-sm font-bold text-[#181411]">{p.price}</div>
                            </div>
                          </div>
                          <div>{statusBadge(p.status)}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                            {p.category.name}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                            {p.venue.name}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-[#181411] hover:bg-slate-50 flex items-center justify-center gap-1"
                            onClick={() => handleEdit(p.id)}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Editar
                          </button>
                          <button
                            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-[#181411] hover:bg-slate-50 flex items-center justify-center gap-1"
                            onClick={() => handleViewDetails(p.id)}
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Ver
                          </button>
                          <button
                            className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1 ${
                              p.status === 'inactive'
                                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                : 'border-red-200 text-red-600 hover:bg-red-50'
                            }`}
                            onClick={() => {
                              if (p.status === 'inactive') {
                                handleToggleStatus(p.id, p.status, p.businessId || p.venue.id);
                              } else {
                                setConfirmProduct({
                                  id: p.id,
                                  name: p.name,
                                  status: p.status,
                                  businessId: p.businessId || p.venue.id,
                                });
                              }
                            }}
                            disabled={updatingStatusId === p.id}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {p.status === 'inactive' ? 'restart_alt' : 'delete'}
                            </span>
                            {p.status === 'inactive' ? 'Activar' : 'Eliminar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Paginación */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-center sm:text-left">
                      Mostrando{' '}
                      <span className="text-[#181411]">
                        {displayedProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                        {displayedProducts.length > 0
                          ? `-${Math.min(currentPage * pageSize, displayedProducts.length)}`
                          : ''}
                      </span>{' '}
                      de <span className="text-[#181411]">{displayedProducts.length}</span> productos
                    </span>
                    <div className="flex items-center gap-2 justify-center sm:justify-end">
                      <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-primary/20 rounded-lg text-sm font-bold bg-white text-[#181411] hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      >
                        Anterior
                      </button>
                      <span className="text-sm text-[#8a7560] font-medium">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-primary/20 rounded-lg text-sm font-bold bg-white text-[#181411] hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
          onClick={() => {
            setShowCategoryModal(false);
            setNewCategory('');
            setCategoryError(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto"
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
                const ctx = readOperatingContext();
                const businessId =
                  ctx?.type === 'business' && ctx.business_id ? Number(ctx.business_id) : undefined;
                if (!businessId || Number.isNaN(businessId)) {
                  setCategoryError('No hay un local seleccionado en el contexto.');
                  return;
                }
                setSavingCategory(true);
                setCategoryError(null);
                try {
                  const resp = await categoryService.create({
                    name: newCategory.trim(),
                    business_id: businessId,
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
                  setShowCategoryModal(false);
                  setNewCategory('');
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
              {/* Selección de locales removida: se usa el business del contexto */}
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
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
          onClick={() => {
            setShowProductModal(false);
            setProductError(null);
            setProductForm({
              name: '',
              description: '',
              sku: '',
              price: '',
              category_id: '',
              status: 'active',
              options: '',
              image: null,
            });
            setEditingProductId(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-2xl p-6 relative max-h-[85vh] overflow-y-auto"
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
                  sku: '',
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
                const ctx = readOperatingContext();
                const ctxBusinessId =
                  ctx?.type === 'business' && ctx.business_id ? Number(ctx.business_id) : undefined;
                if (!ctxBusinessId || Number.isNaN(ctxBusinessId)) {
                  setProductError('No hay un local seleccionado en el contexto.');
                  return;
                }
                setProductSaving(true);
                try {
                  let promise: Promise<unknown>;
                  if (editingProductId) {
                    promise = productService.update(editingProductId, {
                      name: productForm.name,
                      description: productForm.description || undefined,
                      sku: productForm.sku || undefined,
                      price: productForm.price,
                      category_id: productForm.category_id,
                      status: productForm.status,
                      options: productForm.options || undefined,
                      business_ids: [ctxBusinessId],
                    });
                  } else {
                    promise = productService.createWithImage({
                      name: productForm.name,
                      description: productForm.description || undefined,
                      sku: productForm.sku || undefined,
                      price: productForm.price,
                      category_id: productForm.category_id,
                      status: productForm.status,
                      options: productForm.options || undefined,
                      business_id: ctxBusinessId,
                      image: productForm.image || undefined,
                    });
                  }

                  await toast.promise(promise, {
                    pending: editingProductId ? 'Actualizando producto...' : 'Creando producto...',
                    success: editingProductId ? 'Producto actualizado' : 'Producto creado',
                    error: 'No se pudo guardar el producto',
                  });

                  setShowProductModal(false);
                  setProductForm({
                    name: '',
                    description: '',
                  sku: '',
                    price: '',
                    category_id: '',
                    status: 'active',
                    options: '',
                    image: null,
                  });
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
                <label className="text-sm font-semibold text-[#181411]">SKU (opcional)</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={productForm.sku}
                  onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))}
                  placeholder="Ej. SKU-123 (vacío = auto)"
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
              {/* Asociar a locales: se usa el business del contexto, no selección manual */}
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
                  sku: '',
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
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-md max-h-[85vh] overflow-hidden relative"
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

      {confirmProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
          onClick={() => setConfirmProduct(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => setConfirmProduct(null)}
              aria-label="Cerrar confirmación"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-[#181411]">Eliminar producto</h4>
                <p className="text-sm text-gray-600">
                  ¿Seguro que deseas eliminar el producto <strong>{confirmProduct.name}</strong>?
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                onClick={() => setConfirmProduct(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60"
                disabled={!!updatingStatusId}
                onClick={() => {
                  if (!confirmProduct) return;
                  handleToggleStatus(
                    confirmProduct.id,
                    confirmProduct.status,
                    confirmProduct.businessId
                  );
                  setConfirmProduct(null);
                }}
              >
                {updatingStatusId === confirmProduct.id ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editCategory && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
          onClick={() => setEditCategory(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => setEditCategory(null)}
              aria-label="Cerrar edición"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">edit</span>
              <h4 className="text-lg font-bold text-[#181411]">Editar categoría</h4>
            </div>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editCategoryName.trim()) {
                  toast.error('El nombre es obligatorio');
                  return;
                }
                const businessParam = resolveBusinessId();
                if (!businessParam) {
                  toast.error('Selecciona un local para editar la categoría.');
                  return;
                }
                setSavingCategoryEdit(true);
                try {
                  await toast.promise(
                    categoryService.update(
                      editCategory.id,
                      { name: editCategoryName.trim() },
                      { business_id: businessParam }
                    ),
                    {
                      pending: 'Actualizando categoría...',
                      success: 'Categoría actualizada',
                      error: 'No se pudo actualizar la categoría',
                    }
                  );
                  setEditCategory(null);
                  setEditCategoryName('');
                  await loadCategories();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Error al actualizar');
                } finally {
                  setSavingCategoryEdit(false);
                }
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Nombre</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  onClick={() => setEditCategory(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCategoryEdit}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingCategoryEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmCategory && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
          onClick={() => setConfirmCategory(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => setConfirmCategory(null)}
              aria-label="Cerrar confirmación categoría"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-[#181411]">Eliminar categoría</h4>
                <p className="text-sm text-gray-600">
                  ¿Seguro que deseas eliminar la categoría <strong>{confirmCategory.name}</strong>?
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                onClick={() => setConfirmCategory(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60"
                disabled={!!deletingCategoryId}
                onClick={async () => {
                  const businessParam = resolveBusinessId();
                  if (!businessParam) {
                    toast.error('Selecciona un local para eliminar la categoría.');
                    return;
                  }
                  setDeletingCategoryId(confirmCategory.id);
                  try {
                    await toast.promise(
                      categoryService.remove(confirmCategory.id, { business_id: businessParam }),
                      {
                        pending: 'Eliminando categoría...',
                        success: 'Categoría eliminada',
                        error: 'No se pudo eliminar la categoría',
                      }
                    );
                    await loadCategories();
                    setConfirmCategory(null);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Error al eliminar');
                  } finally {
                    setDeletingCategoryId(null);
                  }
                }}
              >
                {deletingCategoryId === confirmCategory.id ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
          onClick={() => {
            setShowImportModal(false);
            setImportError(null);
            setImportFile(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => {
                setShowImportModal(false);
                setImportError(null);
                setImportFile(null);
              }}
              aria-label="Cerrar importación"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">upload</span>
              <h4 className="text-lg font-bold text-[#181411]">Importar productos (CSV)</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Formato esperado (cabeceras): business_id, name, price, category_id, description,
              status, sku, image_url. Si falta status se usa ACTIVE; si falta SKU se genera.
            </p>
            <div className="space-y-3">
              <input
                type="file"
                accept=".csv,text/csv"
                className="w-full text-sm"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              {importError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {importError}
                </div>
              )}
              {importSummary && (
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  {importSummary}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportError(null);
                    setImportFile(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={importing}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
                  onClick={handleImport}
                >
                  {importing ? 'Importando...' : 'Importar CSV'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCategoriesList && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
          onClick={() => setShowCategoriesList(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-lg p-6 relative max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => setShowCategoriesList(false)}
              aria-label="Cerrar categorías"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">category</span>
              <h4 className="text-lg font-bold text-[#181411]">Categorías disponibles</h4>
              <span className="ml-auto text-xs font-semibold text-gray-500">
                {categories.filter((c) => c.id !== '').length} en total
              </span>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[60vh]">
              {categories.filter((c) => c.id !== '').length === 0 ? (
                <div className="py-4 text-sm text-gray-500">
                  No tienes categorías creadas. Crea una para asociar productos.
                </div>
              ) : (
                categories
                  .filter((c) => c.id !== '')
                  .map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary bg-primary/10 rounded-full p-2">
                          {c.icon || 'category'}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-[#181411]">{c.name}</div>
                          <div className="text-xs text-gray-500">ID: {c.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-primary text-xs font-semibold hover:underline"
                          onClick={() => {
                            setEditCategory({ id: c.id, name: c.name });
                            setEditCategoryName(c.name);
                            setShowCategoriesList(false);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-red-600 text-xs font-semibold hover:underline"
                          onClick={() => {
                            setConfirmCategory({ id: c.id, name: c.name });
                            setShowCategoriesList(false);
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90"
                onClick={() => {
                  setShowCategoriesList(false);
                  setShowCategoryModal(true);
                }}
              >
                Crear categoría
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
          onClick={() => setShowExportConfirm(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => setShowExportConfirm(false)}
              aria-label="Cerrar exportación"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">download</span>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-[#181411]">Exportar productos</h4>
                <p className="text-sm text-gray-600">
                  Se exportarán los productos del dueño (filtros aplicados: categoría, local,
                  estado). ¿Deseas continuar?
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                onClick={() => setShowExportConfirm(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={exporting}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
                onClick={handleExport}
              >
                {exporting ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

