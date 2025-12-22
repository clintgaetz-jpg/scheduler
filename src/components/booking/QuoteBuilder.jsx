import React, { useState } from 'react';
import { X, Package, History, AlertTriangle, Plus, ChevronDown } from 'lucide-react';

// Format money helper
const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '$0.00';
  return '$' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ============================================
// QuoteBuilder Component
// Shows selected services and calculates totals
// 
// LAYOUT: Flex column, full height
// - Quick Add (collapsible, fixed)
// - Services List (scrollable, grows)
// - Totals (fixed at bottom)
// ============================================

export function QuoteBuilder({ 
  services, 
  totals, 
  onRemove, 
  servicePackages = [],
  onAddPackage,
  showQuickAdd = true 
}) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      
      {/* ============================================
          SECTION 1: Quick Add Packages (collapsible)
          ============================================ */}
      {showQuickAdd && servicePackages.length > 0 && (
        <div className="flex-shrink-0 mb-3">
          <button
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 mb-2"
          >
            <Plus size={14} />
            <span>Quick Add Package</span>
            <ChevronDown 
              size={14} 
              className={`transition-transform ${quickAddOpen ? 'rotate-180' : ''}`}
            />
          </button>
          
          {quickAddOpen && (
            <div className="flex flex-wrap gap-1 p-2 bg-white border border-gray-200 rounded-lg">
              {servicePackages
                .filter(pkg => pkg.is_active !== false)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map(pkg => {
                  const price = parseFloat(pkg.base_price) || parseFloat(pkg.default_price) || 0;
                  const hours = parseFloat(pkg.base_hours) || parseFloat(pkg.default_hours) || 1;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => {
                        onAddPackage({
                          ...pkg,
                          price: price,
                          hours: hours
                        });
                      }}
                      className="text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                      title={`${pkg.name} - ${formatMoney(price)} - ${hours}h`}
                    >
                      {pkg.name}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ============================================
          SECTION 2: Services List (scrollable)
          ============================================ */}
      <div className="flex-1 min-h-0 flex flex-col">
        <label className="flex-shrink-0 block text-xs text-gray-500 mb-2">
          Services ({services.length})
        </label>
        
        {services.length === 0 ? (
          <div className="text-sm text-gray-400 py-4 text-center">
            No services added
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {services.map(service => (
              <ServiceRow 
                key={service.id} 
                service={service} 
                onRemove={() => onRemove(service.id)} 
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          SECTION 3: Totals (compact)
          ============================================ */}
      <div className="flex-shrink-0 border-t border-gray-200 pt-2 mt-2">
        {/* Compact totals row */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{totals.hours.toFixed(1)}h</span>
          <span>+supplies +GST {totals.bufferEnabled && `+${totals.bufferPercent}%`}</span>
        </div>
        
        {/* Grand total */}
        <div className="flex justify-between font-bold text-base mt-1">
          <span>Estimate</span>
          <span className="text-green-600">{formatMoney(totals.total)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ServiceRow - Single service in the quote
// Clean, compact display
// ============================================
function ServiceRow({ service, onRemove }) {
  // Source indicator config
  const sourceConfig = {
    history: { 
      icon: History, 
      color: 'text-green-600', 
      bg: 'bg-green-50 border-green-200',
      label: 'History'
    },
    deferred: { 
      icon: AlertTriangle, 
      color: 'text-red-600', 
      bg: 'bg-red-50 border-red-200',
      label: 'Deferred'
    },
    package: { 
      icon: Package, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50 border-blue-200',
      label: 'Package'
    }
  };
  
  const config = sourceConfig[service.source] || sourceConfig.package;
  const Icon = config.icon;

  return (
    <div className={`flex items-start justify-between p-2 rounded-lg border ${config.bg}`}>
      {/* Left: Name and meta */}
      <div className="flex-1 min-w-0 mr-2">
        <div className="text-sm font-medium text-gray-900 leading-tight">
          {service.name}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span className={`flex items-center gap-1 ${config.color}`}>
            <Icon size={10} />
            {config.label}
            {service.sourceWO && <span>#{service.sourceWO}</span>}
          </span>
          <span>•</span>
          <span>{service.hours}h</span>
        </div>
      </div>
      
      {/* Right: Price and remove */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-900">
          {formatMoney(service.price)}
        </span>
        <button 
          onClick={onRemove} 
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
          title="Remove from quote"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default QuoteBuilder;
