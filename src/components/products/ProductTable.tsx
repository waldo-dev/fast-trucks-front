import React from 'react';
import { ProductRow } from './ProductRow';

interface Product {
  id: number;
  name: string;
  sku: string;
  image: string;
  venue: {
    name: string;
    location: string;
  };
  category: {
    name: string;
    icon: string;
  };
  price: string;
  status: 'active' | 'paused' | 'draft';
}

interface ProductTableProps {
  products: Product[];
  onEdit: (id: number) => void;
  onViewDetails: (id: number) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onViewDetails,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-primary/10 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-primary/5 border-b border-primary/10">
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
              Producto
            </th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
              Local
            </th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
              Categoría
            </th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
              Precio
            </th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">
              Estado
            </th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary/5">
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onEdit={onEdit}
              onViewDetails={onViewDetails}
            />
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="px-6 py-4 bg-primary/5 flex items-center justify-between border-t border-primary/10">
        <p className="text-sm text-gray-500 font-medium">Mostrando 1 a 4 de 59 entradas</p>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 bg-white border border-primary/10 rounded text-sm text-gray-400 cursor-not-allowed"
            disabled
          >
            Anterior
          </button>
          <button className="px-3 py-1 bg-primary text-white rounded text-sm font-bold">1</button>
          <button className="px-3 py-1 bg-white border border-primary/10 rounded text-sm text-gray-600 hover:bg-primary/5">
            2
          </button>
          <button className="px-3 py-1 bg-white border border-primary/10 rounded text-sm text-gray-600 hover:bg-primary/5">
            3
          </button>
          <span className="text-gray-400 px-1">...</span>
          <button className="px-3 py-1 bg-white border border-primary/10 rounded text-sm text-gray-600 hover:bg-primary/5">
            15
          </button>
          <button className="px-3 py-1 bg-white border border-primary/10 rounded text-sm text-gray-600 hover:bg-primary/5">
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};








