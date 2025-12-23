import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, RefreshCw, Eye, Package, ChevronDown } from 'lucide-react';

const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

// ============================================
// PARTS INVOICE PANEL - Sidebar Version
// Fetches supplier_invoices from appointments table
// ============================================

export default function PartsInvoicePanel({ appointment, onUpdate }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [viewedInvoices, setViewedInvoices] = useState(new Set());

  // Fetch invoices from database when appointment changes
  useEffect(() => {
    if (appointment?.id) {
      fetchInvoices();
    }
  }, [appointment?.id, appointment?.workorder_number]);

  const fetchInvoices = async () => {
    if (!appointment?.workorder_number) return;
    setLoading(true);
    try {
      // Fetch from appointments table by workorder_number
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/appointments?workorder_number=eq.${appointment.workorder_number}&select=supplier_invoices`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      const data = await res.json();
      // Find the first appointment with invoices
      const invoicesData = data?.find(d => d.supplier_invoices?.length > 0)?.supplier_invoices || [];
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setInvoices([]);
    }
    setLoading(false);
  };

  // Load viewed state from localStorage
  useEffect(() => {
    if (appointment?.workorder_number) {
      const key = `viewed_invoices_${appointment.workorder_number}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setViewedInvoices(new Set(JSON.parse(stored)));
        } catch (e) {
          setViewedInvoices(new Set());
        }
      }
    }
  }, [appointment?.workorder_number]);

  const markAsViewed = (invoiceId) => {
    const newViewed = new Set(viewedInvoices);
    newViewed.add(invoiceId);
    setViewedInvoices(newViewed);
    
    // Persist to localStorage
    if (appointment?.workorder_number) {
      const key = `viewed_invoices_${appointment.workorder_number}`;
      localStorage.setItem(key, JSON.stringify([...newViewed]));
    }
  };

  const markAllAsViewed = () => {
    const allInvoiceIds = invoices.map(inv => inv.invoice_id || inv.invoice_number).filter(Boolean);
    const newViewed = new Set([...viewedInvoices, ...allInvoiceIds]);
    setViewedInvoices(newViewed);
    
    // Persist to localStorage
    if (appointment?.workorder_number) {
      const key = `viewed_invoices_${appointment.workorder_number}`;
      localStorage.setItem(key, JSON.stringify([...newViewed]));
    }
    
    // Also update the appointment's invoices_reviewed_at
    if (onUpdate) {
      onUpdate('invoices_reviewed_at', new Date().toISOString());
    }
  };

  const isNew = (invoice) => {
    const id = invoice.invoice_id || invoice.invoice_number;
    return !viewedInvoices.has(id);
  };

  const newCount = invoices.filter(inv => isNew(inv)).length;
  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // No WO assigned or no invoices
  if (!appointment?.workorder_number) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Package size={12} />
          Parts Invoices
          {newCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full animate-pulse">
              {newCount} NEW
            </span>
          )}
        </h3>
        <button
          onClick={fetchInvoices}
          disabled={loading}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Refresh invoices"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* No Invoices */}
      {invoices.length === 0 && (
        <div className="text-xs text-gray-400 italic py-2">
          No invoices for PO #{appointment.workorder_number}
        </div>
      )}

      {/* Summary Bar */}
      {invoices.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
            <span className="text-xs font-semibold text-gray-900">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {newCount > 0 && (
            <button
              onClick={markAllAsViewed}
              className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Eye size={10} />
              Mark all viewed
            </button>
          )}
        </div>
      )}

      {/* Invoice List */}
      {invoices.length > 0 && (
        <div className="space-y-2">
          {invoices.map((invoice, index) => {
            const invoiceId = invoice.invoice_id || invoice.invoice_number || `inv-${index}`;
            const isNewInvoice = isNew(invoice);
            const isExpanded = expandedInvoice === invoiceId;
            const items = invoice.items || [];
            
            return (
              <div 
                key={invoiceId}
                className={`rounded-lg border transition-all ${
                  isNewInvoice 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Invoice Card */}
                <div className="p-2.5">
                  {/* Top Row: Supplier + NEW badge */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-gray-800 truncate">
                      {invoice.supplier || 'Unknown Supplier'}
                    </span>
                    {isNewInvoice && (
                      <span className="px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded">
                        NEW
                      </span>
                    )}
                  </div>
                  
                  {/* Invoice Number (clickable link) + Total */}
                  <div className="flex items-center justify-between">
                    <a
                      href={invoice.pdf_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { if (isNewInvoice) markAsViewed(invoiceId); }}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium flex items-center gap-1"
                    >
                      #{invoice.invoice_number || 'Unknown'}
                      <ExternalLink size={10} className="opacity-50" />
                    </a>
                    <span className="text-sm font-bold text-gray-900">
                      ${(parseFloat(invoice.total) || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Date + Items count + Expand */}
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-500">
                    <span>
                      {invoice.invoice_date && new Date(invoice.invoice_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    {items.length > 0 && (
                      <button
                        onClick={() => {
                          if (isNewInvoice) markAsViewed(invoiceId);
                          setExpandedInvoice(isExpanded ? null : invoiceId);
                        }}
                        className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                      >
                        <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                        <ChevronDown 
                          size={12} 
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Expanded Items */}
                {isExpanded && items.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-2">
                    <div className="space-y-1">
                      {items.map((item, itemIndex) => (
                        <div 
                          key={itemIndex} 
                          className="group relative text-[10px] py-1 px-1.5 rounded hover:bg-white transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex-1 text-gray-700 leading-tight">
                              {item.description?.split('\n')[0] || 'No description'}
                            </span>
                            <span className="text-gray-500 flex-shrink-0">×{item.quantity || 1}</span>
                            <span className="text-gray-700 font-medium flex-shrink-0 w-12 text-right">
                              ${(parseFloat(item.line_total) || 0).toFixed(2)}
                            </span>
                          </div>
                          {item.part_number && (
                            <div className="text-[9px] text-gray-400 font-mono mt-0.5">
                              {item.part_number}
                            </div>
                          )}
                          {/* Core/Warranty badges */}
                          {(item.is_core || item.is_warranty) && (
                            <div className="flex gap-1 mt-1">
                              {item.is_core && (
                                <span className="px-1 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold rounded">CORE</span>
                              )}
                              {item.is_warranty && (
                                <span className="px-1 py-0.5 bg-purple-100 text-purple-700 text-[8px] font-bold rounded">WTY</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
