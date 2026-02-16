import React from 'react';

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

interface ProductRowProps {
  product: Product;
  onEdit: (id: number) => void;
  onViewDetails: (id: number) => void;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  product,
  onEdit,
  onViewDetails,
}) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-gray-100 text-gray-500';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'paused':
        return 'Pausado';
      case 'draft':
        return 'Borrador';
      default:
        return 'Activo';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'Pizza':
        return 'Pizza';
      case 'Burgers':
        return 'Hamburguesas';
      case 'Sides':
        return 'Acompañamientos';
      case 'Drinks':
        return 'Bebidas';
      default:
        return category;
    }
  };

  return (
    <tr className="hover:bg-primary/5 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
            <img className="w-full h-full object-cover" src={product.image} alt={product.name} />
          </div>
          <div>
            <p className="font-bold text-sm">{product.name}</p>
            <p className="text-xs text-gray-400">SKU: {product.sku}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{product.venue.name}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
            {product.venue.location}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 px-2 py-1 bg-background-light rounded-md w-fit">
          <span className="material-symbols-outlined text-[16px] text-primary">
            {product.category.icon}
          </span>
          <span className="text-xs font-semibold">{getCategoryLabel(product.category.name)}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm font-bold text-primary">{product.price}</span>
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusClass(
            product.status
          )}`}
        >
          {getStatusLabel(product.status)}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => onViewDetails(product.id)}
          className="p-1 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </td>
    </tr>
  );
};

