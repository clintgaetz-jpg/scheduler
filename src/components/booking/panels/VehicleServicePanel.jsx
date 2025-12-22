import React, { useState, useEffect } from 'react';
import { 
  Car, History, Package, ChevronDown, ChevronRight,
  Plus, Search, Loader2, AlertTriangle, Gauge, Calendar,
  CheckCircle, Clock
} from 'lucide-react';
import { VehicleHistoryList } from '../parts/VehicleHistoryList';
import { ServiceFavorites } from '../parts/ServiceFavorites';
import { CustomLineInput } from '../parts/CustomLineInput';

// ============================================
// VehicleServicePanel - Middle Panel
// Shows selected vehicle, history, and service picker
// ============================================

export function VehicleServicePanel({
  customer,
  selectedVehicle,
  vehicleHistory,
  vehicleHistoryLoading,
  servicePackages = [],
  serviceCategories = [],
  onAddService,
  onAddCustomLine,
  addedServiceIds = [],
  onLoadVehicleHistory
}) {
  const [activeTab, setActiveTab] = useState('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['favorites']));

  useEffect(() => {
    if (selectedVehicle && !selectedVehicle.isNew && selectedVehicle.vin && !vehicleHistory) {
      onLoadVehicleHistory?.(selectedVehicle.vin);
    }
  }, [selectedVehicle?.vin]);

  const favorites = servicePackages.filter(p => p.is_favorite && p.is_active !== false);

  const packagesByCategory = serviceCategories
    .filter(cat => !cat.is_hidden)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(cat => ({
      ...cat,
      packages: servicePackages.filter(p => 
        p.category === cat.id && 
        p.is_active !== false &&
        !p.is_favorite
      ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    }))
    .filter(cat => cat.packages.length > 0);

  const filteredPackages = searchTerm
    ? servicePackages.filter(p => 
        p.is_active !== false &&
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  if (!customer) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <Car size={48} className="mx-auto mb-3 opacity-30" />
          <p>Select a customer to begin</p>
        </div>
      </div>
    );
  }

  if (!selectedVehicle) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <Car size={48} className="mx-auto mb-3 opacity-30" />
          <p>Select a vehicle from the list</p>
          <p className="text-sm mt-1">or add a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Vehicle Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Car size={20} className="text-blue-600" />
              {selectedVehicle.isNew ? 'New Vehicle' : (
                `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
              )}
            </h3>
            {!selectedVehicle.isNew && (
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                {selectedVehicle.plate && (
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {selectedVehicle.plate}
                  </span>
                )}
                {selectedVehicle.color && <span>{selectedVehicle.color}</span>}
                {selectedVehicle.engine && (
                  <span className="text-xs text-gray-500 truncate max-w-[200px]">
                    {selectedVehicle.engine}
                  </span>
                )}
              </div>
            )}
          </div>

          {!selectedVehicle.isNew && selectedVehicle.service_status && (
            <StatusBadge status={selectedVehicle.service_status} />
          )}
        </div>

        {!selectedVehicle.isNew && (
          <div className="flex items-center gap-6 mt-3 text-sm">
            {selectedVehicle.last_mileage && (
              <span className="flex items-center gap-1 text-gray-600">
                <Gauge size={14} className="text-gray-400" />
                Last: {selectedVehicle.last_mileage.toLocaleString()} km
              </span>
            )}
            {selectedVehicle.estimated_current_mileage && (
              <span className="text-gray-500">
                → Est: {selectedVehicle.estimated_current_mileage.toLocaleString()} km
              </span>
            )}
            {selectedVehicle.days_since_service != null && (
              <span className="flex items-center gap-1 text-gray-600">
                <Calendar size={14} className="text-gray-400" />
                {selectedVehicle.days_since_service === 0 
                  ? 'Serviced today' 
                  : `${selectedVehicle.days_since_service}d since service`
                }
              </span>
            )}
          </div>
        )}

        {vehicleHistory?.stats && (
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{vehicleHistory.stats.total_invoices} visits</span>
            <span>${vehicleHistory.stats.total_spent?.toLocaleString()} total</span>
            <span>Avg: ${vehicleHistory.stats.avg_invoice?.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={16} />
          History
          {vehicleHistory?.invoices?.length > 0 && (
            <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
              {vehicleHistory.invoices.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            activeTab === 'services'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package size={16} />
          Services
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        
        {activeTab === 'history' && (
          <div className="p-4">
            {vehicleHistoryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            ) : selectedVehicle.isNew ? (
              <div className="text-center py-12 text-gray-400">
                <History size={32} className="mx-auto mb-2 opacity-30" />
                <p>New vehicle - no history yet</p>
              </div>
            ) : vehicleHistory?.invoices?.length > 0 ? (
              <VehicleHistoryList
                invoices={vehicleHistory.invoices}
                onAddService={onAddService}
                addedServiceIds={addedServiceIds}
              />
            ) : (
              <div className="text-center py-12 text-gray-400">
                <History size={32} className="mx-auto mb-2 opacity-30" />
                <p>No service history found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="p-4 space-y-4">
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search services..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown size={16} />
                </button>
              )}
            </div>

            {filteredPackages && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 mb-2">
                  {filteredPackages.length} results for "{searchTerm}"
                </p>
                {filteredPackages.map(pkg => (
                  <PackageButton
                    key={pkg.id}
                    pkg={pkg}
                    onAdd={() => onAddService(pkg, 'package')}
                    isAdded={addedServiceIds.includes(pkg.id)}
                  />
                ))}
              </div>
            )}

            {!filteredPackages && (
              <>
                {favorites.length > 0 && (
                  <ServiceFavorites
                    favorites={favorites}
                    onAddService={onAddService}
                    addedServiceIds={addedServiceIds}
                  />
                )}

                {packagesByCategory.map(cat => (
                  <div key={cat.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full px-3 py-2 bg-gray-50 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <span>{cat.name || cat.display_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{cat.packages.length}</span>
                        <ChevronDown 
                          size={14} 
                          className={`text-gray-400 transition-transform ${
                            expandedCategories.has(cat.id) ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>
                    {expandedCategories.has(cat.id) && (
                      <div className="p-2 space-y-1 bg-white">
                        {cat.packages.map(pkg => (
                          <PackageButton
                            key={pkg.id}
                            pkg={pkg}
                            onAdd={() => onAddService(pkg, 'package')}
                            isAdded={addedServiceIds.includes(pkg.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <CustomLineInput onAdd={onAddCustomLine} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    recent: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'OK' },
    due_soon: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'DUE SOON' },
    overdue: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle, label: 'OVERDUE' }
  };
  
  const c = config[status] || config.recent;
  const Icon = c.icon;
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${c.bg} ${c.text}`}>
      <Icon size={12} />
      {c.label}
    </span>
  );
}

function PackageButton({ pkg, onAdd, isAdded }) {
  const price = parseFloat(pkg.base_price || pkg.default_price) || 0;
  const hours = parseFloat(pkg.base_hours || pkg.default_hours) || 1;
  
  return (
    <button
      onClick={onAdd}
      disabled={isAdded}
      className={`
        w-full px-3 py-2 rounded-lg text-left text-sm flex items-center justify-between
        transition-colors border
        ${isAdded 
          ? 'bg-green-50 border-green-200 text-green-700 cursor-default' 
          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        }
      `}
    >
      <div className="flex items-center gap-2">
        {isAdded ? (
          <CheckCircle size={14} className="text-green-500" />
        ) : (
          <Plus size={14} className="text-gray-400" />
        )}
        <span>{pkg.name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-gray-500">{hours}h</span>
        <span className="font-medium">${price.toLocaleString()}</span>
      </div>
    </button>
  );
}

export default VehicleServicePanel;
