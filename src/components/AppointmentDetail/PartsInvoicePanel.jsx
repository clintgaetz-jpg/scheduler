import React, { useState, useEffect } from 'react';
import { Package, ExternalLink, ChevronDown, ChevronUp, RefreshCw, DollarSign, FileText } from 'lucide-react';
import { getPartsInvoices } from '../../utils/supabase';

// ============================================
// PARTS INVOICE PANEL
// Shows invoices for a work order PO number
// ============================================

export default function PartsInvoicePanel({ appointment, onUpdate }) {
  const [invoices, setInvoices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (appointment?.workorder_number) {
      loadInvoices();
    } else {
      setInvoices(null);
    }
  }, [appointment?.workorder_number]);

  const loadInvoices = async () => {
    if (!appointment?.workorder_number) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getPartsInvoices(appointment.workorder_number);
      
      // Handle both single object response and array response
      if (data && !Array.isArray(data)) {
        // It's the full response with summary
        setInvoices(data);
      } else if (Array.isArray(data)) {
        // It's just an array of invoices
        setInvoices({
          po_number: appointment.workorder_number,
          summary: {
            invoice_count: data.length,
            total_parts_cost: data.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0),
            suppliers: [...new Set(data.map(inv => inv.supplier_name || inv.vendor).filter(Boolean))]
          },
          invoices: data
        });
      } else {
        setInvoices(null);
      }
    } catch (err) {
      console.error('Failed to load parts invoices:', err);
      setError('Failed to load invoices');
      setInvoices(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleInvoice = (invoiceNumber) => {
    setExpandedInvoice(expandedInvoice === invoiceNumber ? null : invoiceNumber);
  };

  if (!appointment?.workorder_number) {
    return (
      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
        No work order number assigned
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <RefreshCw size={20} className="animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading invoices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
        {error}
        <button onClick={loadInvoices} className="ml-2 text-blue-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (!invoices || !invoices.invoices || invoices.invoices.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Parts Invoices</span>
          <button
            onClick={loadInvoices}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          No invoices found for PO #{appointment.workorder_number}
        </div>
      </div>
    );
  }

  const { summary, invoices: invoiceList } = invoices;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Parts Invoices</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
            {summary.invoice_count} invoice{summary.invoice_count !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={loadInvoices}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <DollarSign size={14} className="text-gray-600" />
              <span className="font-semibold text-gray-900">
                ${summary.total_parts_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {summary.suppliers && summary.suppliers.length > 0 && (
              <div className="text-gray-600">
                {summary.suppliers.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-2">
        {invoiceList.map((invoice, index) => (
          <div key={invoice.invoice_number || index} className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors bg-white">
            <div className="w-full flex items-center justify-between p-3 cursor-default">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400" />
                  <span className="font-medium text-sm text-gray-900">
                    #{invoice.invoice_number || 'Unknown'}
                  </span>
                  {invoice.supplier_name && (
                    <span className="text-xs text-gray-500">
                      {invoice.supplier_name}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {invoice.invoice_date && new Date(invoice.invoice_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm text-gray-900">
                  ${(parseFloat(invoice.total) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                {invoice.pdf_url ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      window.open(invoice.pdf_url, '_blank', 'noopener,noreferrer');
                    }}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                    title="View PDF in new window"
                  >
                    <ExternalLink size={16} />
                    View PDF
                  </button>
                ) : (
                  <span className="px-3 py-2 text-xs text-gray-400 bg-gray-100 rounded">No PDF Available</span>
                )}
                {invoice.items && invoice.items.length > 0 && (
                  <button
                    onClick={() => toggleInvoice(invoice.invoice_number || index)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Toggle line items"
                  >
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-400 transition-transform ${expandedInvoice === (invoice.invoice_number || index) ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Items */}
            {expandedInvoice === (invoice.invoice_number || index) && invoice.items && invoice.items.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 p-3">
                <div className="text-xs font-medium text-gray-700 mb-2">Line Items:</div>
                <div className="space-y-1">
                  {invoice.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-3 text-xs bg-white p-2 rounded">
                      <span className="font-mono text-gray-500 w-24 truncate">
                        {item.part_number || '-'}
                      </span>
                      <span className="flex-1 text-gray-700 truncate">
                        {item.description || 'No description'}
                      </span>
                      <span className="text-gray-500 w-12 text-right">
                        ×{item.quantity || 1}
                      </span>
                      <span className="text-gray-900 w-20 text-right font-medium">
                        ${(parseFloat(item.line_total) || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

