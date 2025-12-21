import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Check, AlertTriangle, Clock, DollarSign, Wrench, Receipt } from 'lucide-react';

// ============================================
// VehicleHistory Component
// Shows work order history with expandable details
// Green + for completed items, Red + for deferred
// Shows WO totals including GST and shop supplies
// ============================================

export function VehicleHistory({ vehicle, history, onAddService, addedServices = [] }) {
  const [expandedWO, setExpandedWO] = useState(null);

  // Use history prop directly or from vehicle
  const workOrders = history || vehicle?.history || [];

  if (!workOrders || workOrders.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <Wrench size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No service history for this vehicle</p>
      </div>
    );
  }

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    return '$' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isServiceAdded = (pkg, woNumber) => {
    return addedServices.some(s => 
      s.title === pkg.title && 
      (s.wo_number === woNumber || s.woNumber === woNumber)
    );
  };

  const handleAdd = (pkg, isDeferred, woNumber) => {
    if (onAddService) {
      onAddService({
        ...pkg,
        name: pkg.title,
        price: parseFloat(pkg.total) || 0,
        hours: parseFloat(pkg.labor_hours) || 0,
        source: isDeferred ? 'deferred' : 'repeat',
        wo_number: woNumber
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Work Order History */}
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
        Service History
      </div>
      
      {workOrders.slice(0, 5).map((wo, idx) => {
        const isExpanded = expandedWO === wo.workorder_number;
        const completed = wo.completed_packages || [];
        const completedItems = completed.filter(p => !p.is_header && parseFloat(p.total) > 0);
        
        // Get deferred items for THIS work order, sorted by ordinal
        const woDeferred = (wo.deferred_packages || [])
          .filter(p => !p.is_header && parseFloat(p.total) > 0)
          .sort((a, b) => (a.ordinal || 999) - (b.ordinal || 999));
        
        // Calculate totals
        const laborTotal = parseFloat(wo.labor_total) || 0;
        const partsTotal = parseFloat(wo.parts_total) || 0;
        const shopSupplies = parseFloat(wo.shop_supplies) || parseFloat(wo.supplies_total) || 0;
        const gst = parseFloat(wo.gst) || parseFloat(wo.tax_total) || 0;
        const grandTotal = parseFloat(wo.grand_total) || 0;
        const deferredTotal = woDeferred.reduce((sum, d) => sum + parseFloat(d.total || 0), 0);
        
        return (
          <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setExpandedWO(isExpanded ? null : wo.workorder_number)}
              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Receipt size={14} className="text-gray-400" />
                  WO #{wo.workorder_number}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {formatDate(wo.invoice_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign size={10} />
                    {formatMoney(grandTotal)}
                  </span>
                  {completedItems.length > 0 && (
                    <span className="text-green-600 font-medium">
                      {completedItems.length} completed
                    </span>
                  )}
                  {woDeferred.length > 0 && (
                    <span className="text-red-500 font-medium">
                      {woDeferred.length} deferred
                    </span>
                  )}
                </div>
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            
            {isExpanded && (
              <div className="border-t border-gray-100">
                {/* Completed items - GREEN add buttons */}
                {completedItems.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    <div className="px-3 py-1.5 bg-green-50 text-xs font-medium text-green-700 flex items-center gap-1">
                      <Wrench size={12} />
                      Completed Work
                    </div>
                    {completedItems.map((pkg, pIdx) => {
                      const added = isServiceAdded(pkg, wo.workorder_number);
                      return (
                        <div key={pIdx} className="px-3 py-2 flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-700 truncate">{pkg.title}</div>
                            {pkg.labor_hours && (
                              <div className="text-xs text-gray-400">{pkg.labor_hours}h labor</div>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">{formatMoney(pkg.total)}</div>
                          <button
                            onClick={(e) => { e.stopPropagation(); !added && handleAdd(pkg, false, wo.workorder_number); }}
                            disabled={added}
                            className={`p-1 rounded transition-colors flex-shrink-0 ${
                              added 
                                ? 'text-gray-300' 
                                : 'text-green-500 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={added ? 'Added to quote' : 'Add service to quote (repeat)'}
                          >
                            {added ? <Check size={14} /> : <Plus size={14} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* WO Totals Summary */}
                <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Labor:</span>
                      <span className="text-gray-700">{formatMoney(laborTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Parts:</span>
                      <span className="text-gray-700">{formatMoney(partsTotal)}</span>
                    </div>
                    {shopSupplies > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shop Supplies:</span>
                        <span className="text-gray-700">{formatMoney(shopSupplies)}</span>
                      </div>
                    )}
                    {gst > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">GST:</span>
                        <span className="text-gray-700">{formatMoney(gst)}</span>
                      </div>
                    )}
                    <div className="flex justify-between col-span-2 pt-1 border-t border-gray-200 font-medium">
                      <span className="text-gray-700">Total:</span>
                      <span className="text-gray-900">{formatMoney(grandTotal)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Deferred items for THIS WO - RED theme, sorted by ordinal */}
                {woDeferred.length > 0 && (
                  <div className="border-t border-red-200 bg-red-50">
                    <div className="px-3 py-1.5 text-xs font-medium text-red-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Deferred Work ({woDeferred.length})
                      </span>
                      <span className="font-semibold">{formatMoney(deferredTotal)}</span>
                    </div>
                    <div className="divide-y divide-red-100">
                      {woDeferred.map((pkg, dIdx) => {
                        const added = isServiceAdded(pkg, wo.workorder_number);
                        return (
                          <div key={dIdx} className="px-3 py-2 flex items-center gap-2 bg-white/50">
                            <div className="w-5 h-5 rounded bg-red-100 text-red-600 text-xs font-medium flex items-center justify-center flex-shrink-0">
                              {pkg.ordinal || dIdx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{pkg.title}</div>
                              {pkg.labor_hours && (
                                <div className="text-xs text-gray-500">{pkg.labor_hours}h labor</div>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-red-700">
                              {formatMoney(pkg.total)}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); !added && handleAdd(pkg, true, wo.workorder_number); }}
                              disabled={added}
                              className={`p-1 rounded transition-colors flex-shrink-0 ${
                                added 
                                  ? 'text-gray-300' 
                                  : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={added ? 'Added to quote' : 'Add deferred item to quote'}
                            >
                              {added ? <Check size={14} /> : <Plus size={14} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {workOrders.length > 5 && (
        <div className="text-center text-xs text-gray-400 py-2">
          + {workOrders.length - 5} more work orders
        </div>
      )}
    </div>
  );
}

export default VehicleHistory;
