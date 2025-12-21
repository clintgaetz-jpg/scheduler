import React, { useState } from 'react';
import { X, Phone, Mail, MapPin, AlertTriangle, Edit2 } from 'lucide-react';

// ============================================
// CustomerCard Component
// Shows selected customer info with update flags
// ============================================

export function CustomerCard({ customer, onClear, showUpdateFlags = false, onUpdateNeeded }) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updates, setUpdates] = useState({});

  const handleUpdateChange = (field, value) => {
    const newUpdates = { ...updates, [field]: value };
    setUpdates(newUpdates);
    if (onUpdateNeeded) {
      onUpdateNeeded('contact_updates', Object.keys(newUpdates).length > 0, newUpdates);
    }
  };

  // Check for missing info
  const missingPhone = !customer.primary_phone;
  const missingEmail = !customer.email;
  const hasIssues = missingPhone || missingEmail;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium text-gray-900">{customer.file_as}</div>
          {customer.company_name && (
            <div className="text-sm text-gray-600">{customer.company_name}</div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {showUpdateFlags && (
            <button
              onClick={() => setShowUpdateModal(true)}
              className="p-1 hover:bg-blue-100 rounded"
              title="Update customer info"
            >
              <Edit2 size={14} className="text-blue-600" />
            </button>
          )}
          <button
            onClick={onClear}
            className="p-1 hover:bg-blue-100 rounded"
            title="Clear selection"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <Phone size={12} className="text-gray-400" />
          {customer.primary_phone ? (
            <a href={`tel:${customer.primary_phone}`} className="text-blue-600 hover:underline">
              {customer.primary_phone}
            </a>
          ) : (
            <span className="text-red-500 text-xs">MISSING</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Mail size={12} className="text-gray-400" />
          {customer.email ? (
            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
              {customer.email}
            </a>
          ) : (
            <span className="text-red-500 text-xs">MISSING</span>
          )}
        </div>

        {(customer.street || customer.city) && (
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-gray-400" />
            <span className="text-gray-600">
              {[customer.street, customer.city, customer.state].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Update needed warning */}
      {hasIssues && showUpdateFlags && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle size={12} />
          <span>Missing info - update in Protractor</span>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Flag Updates Needed</h3>
              <button onClick={() => setShowUpdateModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Note any info that needs updating in Protractor. This will be added to the appointment notes.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">New Phone</label>
                <input
                  type="text"
                  value={updates.phone || ''}
                  onChange={(e) => handleUpdateChange('phone', e.target.value)}
                  placeholder="Enter correct phone..."
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">New Email</label>
                <input
                  type="email"
                  value={updates.email || ''}
                  onChange={(e) => handleUpdateChange('email', e.target.value)}
                  placeholder="Enter correct email..."
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Other Notes</label>
                <textarea
                  value={updates.notes || ''}
                  onChange={(e) => handleUpdateChange('notes', e.target.value)}
                  placeholder="Any other updates needed..."
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerCard;
