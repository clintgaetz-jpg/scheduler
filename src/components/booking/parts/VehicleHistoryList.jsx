import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Plus, CheckCircle, 
  AlertTriangle, FileText, Clock, DollarSign, Wrench
} from 'lucide-react';

// ============================================
// VehicleHistoryList Component
// Shows all work orders with expandable line items
// Click to add completed or deferred work to quote
// ============================================

export function VehicleHistoryList({ 
  invoices = [], 
  onAddService, 
  addedServiceIds = [] 
}) {
  // Track which WOs are expanded (default: first one)
  const [expandedWOs, setExpandedWOs] = useState(
    new Set(invoices.length > 0 ? [invoices[0].workorder_number] : [])
  );

  const toggleWO = (woNumber) => {
    setExpandedWOs(prev => {
      const next = new Set(prev);
      if (next.has(woNumber)) {
        next.delete(woNumber);
      } else {
        next.add(woNumber);
      }
      return next;
    });
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Check if a package is already added
  const isAdded = (pkg) => {
    // Check by template_id or by name+source_wo combo
    if (pkg.template_id && addedServiceIds.includes(pkg.template_id)) return true;
    const compositeId = `${pkg.source_wo}-${pkg.title}`;
    return addedServiceIds.includes(compositeId);
  };

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => {
        const isExpanded = expandedWOs.has(invoice.workorder_number);
        const hasDeferred = invoice.deferred_packages?.filter(d => !d.is_header).length > 0;
        
        return (
          <div 
            key={invoice.workorder_number}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            {/* WO Header - Click to expand */}
            <button
              onClick={() => toggleWO(invoice.workorder_number)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      WO# {invoice.workorder_number}
                    </span>
                    {hasDeferred && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs flex items-center gap-1">
                        <AlertTriangle size={10} />
                        Deferred
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                    <span>{formatDate(invoice.invoice_date)}</span>
                    {invoice.mileage && (
                      <span>{invoice.mileage.toLocaleString()} km</span>
                    )}
                    {invoice.service_advisor && (
                      <span>Advisor: {invoice.service_advisor}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ${invoice.grand_total?.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {invoice.completed_packages?.length || 0} items
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                
                {/* Completed Packages */}
                {invoice.completed_packages?.length > 0 && (
                  <div className="p-3">
                    <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                      <CheckCircle size={12} className="text-green-500" />
                      Completed Work
                    </div>
                    <div className="space-y-1">
                      {invoice.completed_packages.map((pkg, idx) => (
                        <PackageLine
                          key={idx}
                          pkg={pkg}
                          type="completed"
                          onAdd={() => onAddService({
                            id: pkg.template_id || `${pkg.source_wo}-${pkg.title}`,
                            name: pkg.title,
                            price: pkg.total,
                            hours: pkg.labor_hours,
                            template_id: pkg.template_id,
                            code: pkg.code
                          }, 'history', pkg.source_wo)}
                          isAdded={isAdded(pkg)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Deferred Packages */}
                {invoice.deferred_packages?.filter(d => !d.is_header).length > 0 && (
                  <div className="p-3 bg-amber-50 border-t border-amber-100">
                    <div className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Deferred Work - Customer Declined
                    </div>
                    <div className="space-y-1">
                      {invoice.deferred_packages
                        .filter(d => !d.is_header)
                        .map((pkg, idx) => (
                          <PackageLine
                            key={idx}
                            pkg={pkg}
                            type="deferred"
                            onAdd={() => onAddService({
                              id: pkg.template_id || `${pkg.source_wo}-${pkg.title}-def`,
                              name: pkg.title,
                              price: pkg.total,
                              hours: pkg.labor_hours,
                              template_id: pkg.template_id,
                              code: pkg.code
                            }, 'deferred', pkg.source_wo)}
                            isAdded={isAdded(pkg)}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Labor/Parts Summary */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Wrench size={12} />
                      Labor: ${invoice.labor_total?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      Parts: ${invoice.parts_total?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// PackageLine Component
// Single package in history - clickable to add
// ============================================
function PackageLine({ pkg, type, onAdd, isAdded }) {
  const isDeferred = type === 'deferred';
  
  return (
    <button
      onClick={onAdd}
      disabled={isAdded}
      className={`
        w-full px-3 py-2 rounded-lg text-left text-sm flex items-center justify-between
        transition-colors border
        ${isAdded 
          ? 'bg-green-50 border-green-200 text-green-700 cursor-default' 
          : isDeferred
            ? 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100'
            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        }
      `}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isAdded ? (
          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
        ) : (
          <Plus size={14} className={`flex-shrink-0 ${isDeferred ? 'text-amber-500' : 'text-gray-400'}`} />
        )}
        <span className="truncate">{pkg.title}</span>
        {pkg.selected_for_followup && (
          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs flex-shrink-0">
            Follow-up
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-xs flex-shrink-0 ml-2">
        {pkg.labor_hours && (
          <span className="text-gray-500 flex items-center gap-1">
            <Clock size={10} />
            {pkg.labor_hours}h
          </span>
        )}
        <div className="text-right">
          <div className={`font-medium ${isDeferred ? 'text-amber-700' : 'text-gray-900'}`}>
            ${pkg.total?.toLocaleString()}
          </div>
          {(pkg.labor_total || pkg.parts_total) && (
            <div className="text-gray-400 text-xs">
              L: ${pkg.labor_total?.toLocaleString() || 0} / P: ${pkg.parts_total?.toLocaleString() || 0}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default VehicleHistoryList;
