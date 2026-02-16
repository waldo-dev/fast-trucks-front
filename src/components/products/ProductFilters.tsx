'use client';

import React, { useState } from 'react';

interface ProductFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
}) => {
  const [selectedVenues, setSelectedVenues] = useState<string[]>(['all']);

  const venues = [
    { id: 'all', name: 'Todos los Locales' },
    { id: 'downtown', name: 'Pizzería Centro' },
    { id: 'brooklyn', name: 'Brooklyn Truck' },
    { id: 'station', name: 'Station Express' },
  ];

  const categories = [
    { id: 'pizza', name: 'Pizza', icon: 'local_pizza', count: 24 },
    { id: 'burgers', name: 'Hamburguesas', icon: 'lunch_dining', count: 12 },
    { id: 'sides', name: 'Acompañamientos', icon: 'fastfood', count: 8 },
    { id: 'drinks', name: 'Bebidas', icon: 'local_bar', count: 15 },
  ];

  const statuses = [
    { id: 'active', name: 'Activo', active: selectedStatus === 'active' },
    { id: 'paused', name: 'Pausado', active: selectedStatus === 'paused' },
    { id: 'draft', name: 'Borrador', active: selectedStatus === 'draft' },
  ];

  const handleVenueToggle = (venueId: string) => {
    if (venueId === 'all') {
      setSelectedVenues(['all']);
    } else {
      setSelectedVenues((prev) => {
        const filtered = prev.filter((id) => id !== 'all');
        return filtered.includes(venueId)
          ? filtered.filter((id) => id !== venueId)
          : [...filtered, venueId];
      });
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-primary/10 p-6 flex flex-col gap-8 overflow-y-auto scrollbar-hide">
      {/* Venue Filter */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Por Local
        </h3>
        <div className="space-y-3">
          {venues.map((venue) => (
            <label
              key={venue.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                checked={selectedVenues.includes(venue.id)}
                className="rounded border-gray-300 text-primary focus:ring-primary size-4"
                type="checkbox"
                onChange={() => handleVenueToggle(venue.id)}
              />
              <span className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">
                {venue.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories Filter */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Categorías
        </h3>
        <div className="space-y-1">
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/5 text-primary font-bold'
                    : 'text-gray-600 hover:bg-background-light font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isActive ? 'text-primary' : 'text-gray-400'
                    }`}
                  >
                    {category.icon}
                  </span>
                  {category.name}
                </div>
                <span
                  className={`text-[10px] ${
                    isActive
                      ? 'bg-primary text-white px-1.5 py-0.5 rounded-full'
                      : 'text-gray-400'
                  }`}
                >
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Estado
        </h3>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status.id}
              onClick={() => onStatusChange(status.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                status.active
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {status.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

