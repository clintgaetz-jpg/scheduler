import React, { useState } from 'react';
import { X, Package, Bell, AlertCircle, CheckCircle } from 'lucide-react';

// ============================================
// HOLD MANAGEMENT MODAL
// Put appointment on hold with parts watching options
// ============================================

export default function HoldManagementModal({
  appointment,
  onClose,
  onConfirm
}) {
  const [holdReason, setHoldReason] = useState(appointment?.hold_reason || 'parts');
  const [holdDetails, setHoldDetails] = useState(appointment?.hold_details || '');
  const [watchMode, setWatchMode] = useState('new_invoice'); // 'new_invoice' or 'specific_parts'
  const [watchParts, setWatchParts] = useState([]);
  const [partNumber, setPartNumber] = useState('');

  const handleAddPart = () => {
    if (partNumber.trim()) {
      setWatchParts([...watchParts, partNumber.trim()]);
      setPartNumber('');
    }
  };

  const handleRemovePart = (index) => {
    setWatchParts(watchParts.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const holdData = {
      is_on_hold: true,
      hold_reason: holdReason,
      hold_details: holdDetails,
      hold_at: new Date().toISOString(),
      original_scheduled_date: appointment?.scheduled_date,
      original_tech_id: appointment?.tech_id,
      // Parts watching
      parts_watch_mode: watchMode,
      parts_watch_list: watchMode === 'specific_parts' ? watchParts : null,
      parts_watch_po: appointment?.workorder_number || null,
    };
    
    onConfirm(holdData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Package className="text-amber-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Put on Hold</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="space-y-4">
            
            {/* Hold Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <select
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="parts">Waiting for Parts</option>
                <option value="auth">Waiting for Authorization</option>
                <option value="customer">Waiting for Customer</option>
                <option value="scheduling">Scheduling Conflict</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Hold Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Details (optional)
              </label>
              <textarea
                value={holdDetails}
                onChange={(e) => setHoldDetails(e.target.value)}
                placeholder="Why is this on hold?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            {/* Parts Watching (only if reason is parts) */}
            {holdReason === 'parts' && appointment?.workorder_number && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell size={16} className="text-blue-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Parts Alert Options
                  </label>
                </div>
                
                <div className="space-y-3">
                  {/* Watch Mode Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="watchMode"
                        value="new_invoice"
                        checked={watchMode === 'new_invoice'}
                        onChange={(e) => setWatchMode(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Alert on any new invoice
                        </div>
                        <div className="text-xs text-gray-500">
                          Get notified when any invoice arrives for PO #{appointment.workorder_number}
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="watchMode"
                        value="specific_parts"
                        checked={watchMode === 'specific_parts'}
                        onChange={(e) => setWatchMode(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Watch specific parts
                        </div>
                        <div className="text-xs text-gray-500">
                          Only alert when these specific part numbers arrive
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Specific Parts Input */}
                  {watchMode === 'specific_parts' && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={partNumber}
                          onChange={(e) => setPartNumber(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddPart()}
                          placeholder="Enter part number"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        />
                        <button
                          onClick={handleAddPart}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Add
                        </button>
                      </div>
                      
                      {watchParts.length > 0 && (
                        <div className="space-y-1">
                          {watchParts.map((part, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="font-mono text-sm text-gray-700">{part}</span>
                              <button
                                onClick={() => handleRemovePart(index)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-700">
                        {watchMode === 'new_invoice' ? (
                          <>You'll be notified when any invoice arrives for this work order.</>
                        ) : (
                          <>You'll only be notified when invoices contain the specific parts listed above.</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info for non-parts holds */}
            {holdReason !== 'parts' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-600">
                    This appointment will be moved to the Hold column. You can manually take it off hold when ready.
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Put on Hold
          </button>
        </div>
        
      </div>
    </div>
  );
}

