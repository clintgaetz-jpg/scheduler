import React from 'react';
import { 
  X, Calendar, User, AlertTriangle, Pause,
  GripVertical, Package, History, Edit3, CheckCircle
} from 'lucide-react';
import { HoldReasonSelect } from '../parts/HoldReasonSelect';

// ============================================
// QuoteBookingPanel - Right Panel
// Shows quote lines, totals, and booking controls
// ============================================

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '$0.00';
  return '$' + parseFloat(amount).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

export function QuoteBookingPanel({
  services = [],
  totals = { hours: 0, subtotal: 0, supplies: 0, gst: 0, total: 0 },
  onRemoveService,
  onReorderServices,
  scheduling = {},
  onUpdateScheduling,
  technicians = [],
  holidays = [],
  settings = {},
  canBook,
  validationMessage,
  saving,
  onSave,
  onCancel
}) {
  const isWeekend = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const isHoliday = (dateStr) => {
    return holidays.some(h => h.date === dateStr);
  };

  const getHolidayName = (dateStr) => {
    const holiday = holidays.find(h => h.date === dateStr);
    return holiday?.name || 'Holiday';
  };

  const dateIsWeekend = isWeekend(scheduling.date);
  const dateIsHoliday = isHoliday(scheduling.date);
  const dateBlocked = dateIsWeekend || dateIsHoliday;

  const sourceConfig = {
    history: { icon: History, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
    deferred: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    package: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    custom: { icon: Edit3, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' }
  };

  return (
    <div className="flex flex-col h-full">
      
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h3 className="font-semibold text-gray-900">Quote & Booking</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Services ({services.length})
          </span>
          <span className="text-sm text-gray-500">
            {totals.hours.toFixed(1)}h
          </span>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No services added</p>
            <p className="text-xs mt-1">Select from history or packages</p>
          </div>
        ) : (
          <div className="space-y-2">
            {services.map((service, idx) => {
              const config = sourceConfig[service.source] || sourceConfig.package;
              const Icon = config.icon;
              
              return (
                <div
                  key={service.id}
                  className={`p-3 rounded-lg border ${config.bg} group`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-1 cursor-grab opacity-0 group-hover:opacity-50">
                      <GripVertical size={14} className="text-gray-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm leading-tight">
                            {service.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span className={`flex items-center gap-1 ${config.color}`}>
                              <Icon size={10} />
                              {service.source === 'history' && 'History'}
                              {service.source === 'deferred' && 'Deferred'}
                              {service.source === 'package' && 'Package'}
                              {service.source === 'custom' && 'Custom'}
                              {service.sourceWO && ` #${service.sourceWO}`}
                            </span>
                            <span>•</span>
                            <span>{service.hours}h</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">
                            {formatMoney(service.price)}
                          </span>
                          <button
                            onClick={() => onRemoveService(service.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatMoney(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shop Supplies ({settings.supplies_percent || 5}%)</span>
            <span>{formatMoney(totals.supplies)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST (5%)</span>
            <span>{formatMoney(totals.gst)}</span>
          </div>
          {totals.bufferEnabled && (
            <div className="flex justify-between text-gray-600">
              <span>Buffer ({totals.bufferPercent}%)</span>
              <span>{formatMoney(totals.buffer)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
            <span>Estimate</span>
            <span className="text-green-600">{formatMoney(totals.total)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0 space-y-3">
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar size={12} />
              Date
            </label>
            <input
              type="date"
              value={scheduling.date || ''}
              onChange={(e) => onUpdateScheduling({ date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              disabled={scheduling.saveToHold}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${
                dateBlocked ? 'border-red-300 bg-red-50' : ''
              } ${scheduling.saveToHold ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {dateIsWeekend && !scheduling.saveToHold && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={10} />
                No weekends
              </p>
            )}
            {dateIsHoliday && !scheduling.saveToHold && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={10} />
                Closed: {getHolidayName(scheduling.date)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
              <User size={12} />
              Technician
            </label>
            <select
              value={scheduling.techId || ''}
              onChange={(e) => onUpdateScheduling({ techId: e.target.value || null })}
              disabled={scheduling.saveToHold}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${
                !scheduling.techId && !scheduling.saveToHold ? 'border-amber-300' : ''
              } ${scheduling.saveToHold ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">Select tech...</option>
              {technicians.filter(t => t.is_active).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Notes</label>
          <textarea
            value={scheduling.notes || ''}
            onChange={(e) => onUpdateScheduling({ notes: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            rows={2}
            placeholder="Appointment notes..."
          />
        </div>

        <div className={`p-3 rounded-lg border ${scheduling.saveToHold ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scheduling.saveToHold}
              onChange={(e) => onUpdateScheduling({ saveToHold: e.target.checked })}
              className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Pause size={14} />
              Save to Hold
            </span>
          </label>
          
          {scheduling.saveToHold && (
            <div className="mt-2">
              <HoldReasonSelect
                value={scheduling.holdReason}
                onChange={(reason) => onUpdateScheduling({ holdReason: reason })}
              />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-gray-100 flex-shrink-0">
        {validationMessage && (
          <div className="text-xs text-amber-600 flex items-center gap-1 mb-2">
            <AlertTriangle size={12} />
            {validationMessage}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !canBook}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              scheduling.saveToHold
                ? 'bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : scheduling.saveToHold ? (
              <>
                <Pause size={16} />
                Save to Hold
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Book Appointment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuoteBookingPanel;
