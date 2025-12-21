import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, FileText, ExternalLink, Clock, Check, 
  AlertCircle, ChevronDown, ChevronUp, RefreshCw, DollarSign
} from 'lucide-react';

// ============================================
// PARTS PANEL
// Parts invoices, PO tracking, parts status
// ============================================

// Mock function - in real app, this calls Supabase
const fetchPartsInvoices = async (poNumber) => {
  // This would call: supabase.rpc('get_parts_invoices', { p_po_number: poNumber })
  return [];
};

export default function PartsPanel({ appointment, onUpdate }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState(null);

  // Fetch invoices when WO number is available
  useEffect(() => {
    if (appointment.workorder_number) {
      loadInvoices();
    }
  }, [appointment.workorder_number]);

  const loadInvoices = async () => {
    if (!appointment.workorder_number) return;
    
    setLoading(true);
    try {
      const data = await fetchPartsInvoices(appointment.workorder_number);
      setInvoices(data || []);
    } catch (err) {
      console.error('Failed to load parts invoices:', err);
    }
    setLoading(false);
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0.00';
    return '$' + parseFloat(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Calculate totals
  const totalParts = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // Parts status summary from services
  const partsStatus = {
    needed: appointment.services?.filter(s => s.status === 'hold' && s.hold_reason === 'parts').length || 0,
    ordered: appointment.parts_ordered ? 1 : 0,
    arrived: appointment.parts_arrived ? 1 : 0,
  };

  return (
    <div className="space-y-4">
      {/* Parts Status Overview */}
      <div className="grid grid-cols-3 gap-3">
        <StatusCard
          label="Parts Needed"
          value={partsStatus.needed}
          status={partsStatus.needed > 0 ? 'warning' : 'success'}
          icon={Package}
        />
        <StatusCard
          label="Orders Placed"
          value={invoices.length}
          status={invoices.length > 0 ? 'info' : 'neutral'}
          icon={Truck}
        />
        <StatusCard
          label="Total Cost"
          value={formatMoney(totalParts)}
          status="neutral"
          icon={DollarSign}
        />
      </div>

      {/* Parts Toggle */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={appointment.parts_ordered || false}
            onChange={(e) => onUpdate('parts_ordered', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm">Parts Ordered</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={appointment.parts_arrived || false}
            onChange={(e) => onUpdate('parts_arrived', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-600"
          />
          <span className="text-sm">Parts Arrived</span>
        </label>
      </div>

      {/* Invoices List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            Parts Invoices ({invoices.length})
          </h4>
          <button
            onClick={loadInvoices}
            disabled={loading || !appointment.workorder_number}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {!appointment.workorder_number ? (
          <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
            <FileText size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No work order number</p>
            <p className="text-xs">Authorize work order to see parts invoices</p>
          </div>
        ) : loading ? (
          <div className="text-center py-6 text-gray-400">
            <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
            <p className="text-sm">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
            <Package size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No parts invoices found</p>
          </div>
        ) : (
          invoices.map((invoice, idx) => (
            <InvoiceCard
              key={invoice.id || idx}
              invoice={invoice}
              isExpanded={expandedInvoice === idx}
              onToggle={() => setExpandedInvoice(expandedInvoice === idx ? null : idx)}
            />
          ))
        )}
      </div>

      {/* Parts on Hold Summary */}
      {partsStatus.needed > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-2">
            <AlertCircle size={16} />
            {partsStatus.needed} service(s) waiting for parts
          </div>
          <div className="space-y-1">
            {appointment.services?.filter(s => s.status === 'hold' && s.hold_reason === 'parts').map((service, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{service.name}</span>
                {service.hold_details?.vendor && (
                  <span className="text-gray-500">
                    {service.hold_details.vendor}
                    {service.hold_details.eta && ` - ETA: ${service.hold_details.eta}`}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// STATUS CARD
// ============================================
function StatusCard({ label, value, status, icon: Icon }) {
  const statusColors = {
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    neutral: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  return (
    <div className={`p-3 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} />
        <span className="text-xs opacity-75">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

// ============================================
// INVOICE CARD
// ============================================
function InvoiceCard({ invoice, isExpanded, onToggle }) {
  const formatMoney = (amount) => {
    if (!amount) return '$0.00';
    return '$' + parseFloat(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded ${invoice.vendor === 'NAPA' ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Truck size={16} className={invoice.vendor === 'NAPA' ? 'text-blue-600' : 'text-gray-600'} />
          </div>
          <div className="text-left">
            <div className="font-medium text-sm text-gray-900">
              {invoice.vendor || 'Unknown Vendor'}
            </div>
            <div className="text-xs text-gray-500">
              Invoice #{invoice.invoice_number} • {invoice.invoice_date}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">{formatMoney(invoice.total)}</span>
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 p-3 bg-gray-50">
          {/* Line Items */}
          {invoice.line_items?.length > 0 && (
            <div className="space-y-1 mb-3">
              {invoice.line_items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-mono text-xs text-gray-400 mr-2">{item.part_number}</span>
                    <span className="text-gray-700">{item.description}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">x{item.quantity}</span>
                    <span className="font-medium w-16 text-right">{formatMoney(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Invoice Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            {invoice.pdf_url && (
              <a
                href={invoice.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <FileText size={14} />
                View PDF
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
