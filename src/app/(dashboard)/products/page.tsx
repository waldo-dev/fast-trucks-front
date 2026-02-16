'use client';

import { useState } from 'react';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductTable } from '@/components/products/ProductTable';

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('pizza');
  const [selectedStatus, setSelectedStatus] = useState('active');

  const products = [
    {
      id: 1,
      name: 'Pepperoni Feast (L)',
      sku: 'PIZ-001',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBV9njiOd9F-RY80tXwWZXr2HImJ9eSzSh61GJS2MNGB7-UubybYfCNfFaE8LMGpkmkPc2jJ8LtSc0UJAtgI1mWfbvMzjG-JLG4I-JZCENlEvzhRECz-Bel_nOM_ubMlKZlYdx-ovlme-C6KjP2nBJmIv2f_3OKl2L9B3m2NESrzuNl0GRVlqrI-JjTdhAh6P7S5ZNIf9yA8pGWQ8VGRBQoe-nkpJR17Re1pGwKqygPtTGpopj051QaUzvqyUdSAzKyR8Gk1NjHs6O1',
      venue: {
        name: 'Pizzería Centro',
        location: 'Nueva York, NY',
      },
      category: {
        name: 'Pizza',
        icon: 'local_pizza',
      },
      price: '$18.99',
      status: 'active' as const,
    },
    {
      id: 2,
      name: 'Monster Burger',
      sku: 'BUR-042',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD617j6c1tDgEAZwDolFA8ujINW7kuaPAswxNdc92bEta7aEviv2cBs78uljUA6arpnUe_VnvkyX0y0OCbf5btN6XJxO1IIXNyOYh7PiU0NnoCLsc8uKxyAACpFO4IMLAwTuQGuareWcu3l1-a6OSejwy4qE6WiVQ9G4X0lDI9BqERw9SfWkYbb1WgY8IHAft5HUStr79ZifdJ88zreSZH-S8NEz30nMuAM6sOw4MYasR_k-XXREB7FyQFJPOgkwqr1lklDQeyKAM9T',
      venue: {
        name: 'Brooklyn Truck',
        location: 'Brooklyn, NY',
      },
      category: {
        name: 'Burgers',
        icon: 'lunch_dining',
      },
      price: '$12.50',
      status: 'paused' as const,
    },
    {
      id: 3,
      name: 'Berry Blast Smoothie',
      sku: 'DRK-009',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBUGUId_6w4pd6Rm-mMA66rD3D6Y2vmmoPeQ7_PefAuMvwAU-eVfdXjADMABBiy1riuLp83oIVlShaFPFij6A013j-t-Xhk3Z1bvjizVafDESdibBFyZmdmS6RKhAdo0T1eNzPZmlPSgTfz3vJny7G62KzLeYh-3Fi4Etbu49VrXcjPLxvYfY6T6gjmAe_dma7vyoLIbOoIZhDVBbKe-cqucBSE_n1Z2kBStDG3bUZlGkdHMI5HTI4jT-7s0TQ8PUd4JKG1rC6-kn0h',
      venue: {
        name: 'Pizzería Centro',
        location: 'Nueva York, NY',
      },
      category: {
        name: 'Drinks',
        icon: 'local_bar',
      },
      price: '$6.00',
      status: 'active' as const,
    },
    {
      id: 4,
      name: 'Truffle Parm Fries',
      sku: 'SID-102',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDeJwQQaj4x-iYsaN6IbSSoxmoBFlbQMDm1xjdempMqa9L-OfhdKI9st_t-LR80HaUFbSgzWg52yMTpBJhcqSgpWTQvYCjMOxPAr-XkEnUHWX8XDXYK8cA3E4LIl4snvZoUnhYdeejGMiqwrq-SJQqdJq2h5kFZ-j3qBpDJkDdrwg3pSfUe25ftXaAcpduIzAvxJJe1022lYbcWTLvItvW4J-_bAW6uuEuXEDeGDiLsUV9VSC0WAMYGRXVfNTD_o3XjmVARE3MUL72W',
      venue: {
        name: 'Station Express',
        location: 'Jersey City, NJ',
      },
      category: {
        name: 'Sides',
        icon: 'fastfood',
      },
      price: '$7.99',
      status: 'active' as const,
    },
  ];

  const handleEdit = (id: number) => {
    // Placeholder: sin acción real
    console.log('Editar producto:', id);
  };

  const handleViewDetails = (id: number) => {
    // Placeholder: sin acción real
    console.log('Ver detalles producto:', id);
  };

  const handleAddProduct = () => {
    // Placeholder: sin acción real
    console.log('Agregar nuevo producto');
  };

  const handleExport = () => {
    // Placeholder: sin acción real
    console.log('Exportar');
  };

  const handleSync = () => {
    // Placeholder: sin acción real
    console.log('Sincronizar');
  };

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
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Filters Sidebar */}
        <ProductFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
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
            <ProductTable
              products={products}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

