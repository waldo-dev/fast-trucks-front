'use client';

import React, { useState } from 'react';

interface ProductFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedVenue: string;
  onVenueChange: (venueId: string) => void;
  venues?: Array<{ id: string; name: string }>;
  categories?: Array<{ id: string; name: string; icon?: string; count?: number }>;
  className?: string;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedVenue,
  onVenueChange,
  venues,
  categories,
  className,
}) => {
  const normalizedVenues = venues && venues.length
    ? venues
    : [
        { id: '', name: 'Todos los Locales' },
      ];

  const normalizedCategories =
    categories && categories.length
      ? categories
      : [
          { id: '', name: 'Todas', icon: 'category', count: undefined },
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

  const handleVenueSelect = (venueId: string) => {
    onVenueChange(venueId);
  };

  return (
    <aside
      className={`bg-white p-6 flex flex-col gap-8 overflow-y-auto scrollbar-hide ${className ?? ''}`}
    >
      {/* Venue Filter */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Por Local
        </h3>
        <div className="space-y-3">
          {normalizedVenues.map((venue) => (
            <label
              key={venue.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                checked={selectedVenue === venue.id}
                className="rounded border-gray-300 text-primary focus:ring-primary size-4"
                type="radio"
                name="venue"
                onChange={() => handleVenueSelect(venue.id)}
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
          {normalizedCategories.map((category) => {
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








