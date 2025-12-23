import React from 'react';
import { FileText, ChevronRight, Truck, Package } from 'lucide-react';

// ============================================
// INVOICES PREVIEW
// Summary count/total with click to expand
// ============================================

export default function InvoicesPreview({ appointment, onViewAll }) {
  
  const invoices = appointment.supplier_invoices || [];
  const invoiceCount = invoices.length;
  
  // Calculate total from all invoices
  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
  
  // Calculate total parts count
  const totalParts = invoices.reduce((sum, inv) => sum + (inv.items?.length || 0), 0);
  
  // Check for new invoices (not reviewed)
  const hasNewInvoices = appointment.supplier_invoices?.some(inv => 
    !appointment.invoices_reviewed_at || 
    new Date(inv.attached_at) > new Date(appointment.invoices_reviewed_at)
  );
  
  // Get unique suppliers
  const suppliers = [...new Set(invoices.map(inv => inv.supplier).filter(Boolean))];

  if (invoiceCount === 0) {
    return (
      <div className="space-y-3">
        {/* Section Header */}
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={12} />
          Parts Invoices
        </h3>
        
        <div className="text-sm text-gray-400 italic py-2">
          No invoices attached
        </div>
        
        {!appointment.workorder_number && (
          <div className="text-xs text-gray-400">
            Assign a W/O number to track parts
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={12} />
          Parts Invoices
          {hasNewInvoices && (
            <span className="ml-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </h3>
      </div>
      
      {/* Summary Card - Clickable */}
      <button
        onClick={onViewAll}
        className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded">
              <Truck size={16} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-gray-500">
                {totalParts} parts
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </div>
        
        {/* Supplier List */}
        {suppliers.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {suppliers.map((supplier, i) => (
                <span 
                  key={i}
                  className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                >
                  {supplier}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* New Badge */}
        {hasNewInvoices && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            ● New invoices since last review
          </div>
        )}
      </button>
      
      {/* Quick Invoice List */}
      <div className="space-y-1">
        {invoices.slice(0, 3).map((invoice, i) => (
          <div 
            key={invoice.invoice_id || i}
            className="flex items-center justify-between text-xs py-1 px-2 bg-gray-50 rounded"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-gray-500 truncate">
                #{invoice.invoice_number}
              </span>
              <span className="text-gray-400">
                {invoice.invoice_date}
              </span>
            </div>
            <span className="font-medium text-gray-700">
              ${parseFloat(invoice.total).toFixed(2)}
            </span>
          </div>
        ))}
        
        {invoices.length > 3 && (
          <div className="text-xs text-center text-gray-400 py-1">
            +{invoices.length - 3} more
          </div>
        )}
      </div>
      
    </div>
  );
}
