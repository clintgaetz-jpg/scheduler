import React from 'react';
import { Star, Plus, CheckCircle } from 'lucide-react';

// ============================================
// ServiceFavorites Component
// Shows favorite packages in a quick-access grid
// ============================================

export function ServiceFavorites({ 
  favorites = [], 
  onAddService, 
  addedServiceIds = [] 
}) {
  if (favorites.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Star size={14} className="text-amber-500 fill-amber-500" />
        <span className="text-sm font-medium text-gray-700">Favorites</span>
        <span className="text-xs text-gray-400">({favorites.length})</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {favorites.slice(0, 12).map(pkg => {
          const price = parseFloat(pkg.base_price || pkg.default_price) || 0;
          const hours = parseFloat(pkg.base_hours || pkg.default_hours) || 1;
          const isAdded = addedServiceIds.includes(pkg.id);

          return (
            <button
              key={pkg.id}
              onClick={() => onAddService(pkg, 'package')}
              disabled={isAdded}
              className={`
                px-3 py-2.5 rounded-lg text-left transition-all border
                ${isAdded 
                  ? 'bg-green-50 border-green-300 text-green-700' 
                  : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-sm font-medium leading-tight line-clamp-2">
                  {pkg.name}
                </span>
                {isAdded ? (
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Plus size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                )}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs">
                <span className="text-gray-500">{hours}h</span>
                <span className={`font-semibold ${isAdded ? 'text-green-600' : 'text-gray-700'}`}>
                  ${price.toLocaleString()}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {favorites.length > 12 && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          +{favorites.length - 12} more favorites in categories below
        </p>
      )}
    </div>
  );
}

export default ServiceFavorites;
