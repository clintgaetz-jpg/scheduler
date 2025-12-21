import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, User, Clock, Edit2, Save, Plus } from 'lucide-react';

// ============================================
// NOTES PANEL
// Internal notes, customer notes, alerts
// ============================================

export default function NotesPanel({ appointment, onUpdate }) {
  const [editingInternal, setEditingInternal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [internalDraft, setInternalDraft] = useState(appointment.internal_notes || '');
  const [customerDraft, setCustomerDraft] = useState(appointment.customer_notes || '');

  const saveInternalNotes = () => {
    onUpdate('internal_notes', internalDraft);
    setEditingInternal(false);
  };

  const saveCustomerNotes = () => {
    onUpdate('customer_notes', customerDraft);
    setEditingCustomer(false);
  };

  const formatTimestamp = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-4">
      {/* Alerts Section */}
      {appointment.alerts && appointment.alerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-500" />
            Alerts
          </h4>
          <div className="space-y-2">
            {appointment.alerts.map((alert, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border ${
                  alert.type === 'warning' 
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : alert.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">{alert.title}</div>
                    {alert.message && (
                      <div className="text-sm opacity-80">{alert.message}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internal Notes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <MessageSquare size={14} />
            Internal Notes
          </h4>
          {!editingInternal && (
            <button
              onClick={() => setEditingInternal(true)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Edit2 size={12} />
              Edit
            </button>
          )}
        </div>
        
        {editingInternal ? (
          <div className="space-y-2">
            <textarea
              value={internalDraft}
              onChange={(e) => setInternalDraft(e.target.value)}
              placeholder="Add internal notes (staff only)..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setInternalDraft(appointment.internal_notes || '');
                  setEditingInternal(false);
                }}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveInternalNotes}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Save size={14} />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 min-h-[80px]">
            {appointment.internal_notes ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{appointment.internal_notes}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">No internal notes</p>
            )}
          </div>
        )}
      </div>

      {/* Customer Notes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <User size={14} />
            Customer Notes
          </h4>
          {!editingCustomer && (
            <button
              onClick={() => setEditingCustomer(true)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Edit2 size={12} />
              Edit
            </button>
          )}
        </div>
        
        {editingCustomer ? (
          <div className="space-y-2">
            <textarea
              value={customerDraft}
              onChange={(e) => setCustomerDraft(e.target.value)}
              placeholder="Notes from customer conversation..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setCustomerDraft(appointment.customer_notes || '');
                  setEditingCustomer(false);
                }}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomerNotes}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Save size={14} />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-3 min-h-[80px]">
            {appointment.customer_notes ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{appointment.customer_notes}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">No customer notes</p>
            )}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Clock size={14} />
          Activity
        </h4>
        <div className="space-y-2 text-sm">
          {appointment.created_at && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Created: {formatTimestamp(appointment.created_at)}</span>
            </div>
          )}
          {appointment.arrived_at && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Vehicle arrived: {formatTimestamp(appointment.arrived_at)}</span>
            </div>
          )}
          {appointment.workorder_created && appointment.wo_created_at && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>WO created: {formatTimestamp(appointment.wo_created_at)}</span>
            </div>
          )}
          {appointment.authorized && appointment.authorized_at && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Authorized: {formatTimestamp(appointment.authorized_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
