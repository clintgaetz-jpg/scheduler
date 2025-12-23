import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

// ============================================
// DELETE CONFIRM MODAL
// Simple confirmation before soft delete
// ============================================

export default function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Content */}
        <div className="p-6">
          
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          
          {/* Text */}
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
            Delete Appointment?
          </h3>
          <p className="text-gray-600 text-center mb-6">
            This will cancel the appointment. You can restore it later if needed.
          </p>
          
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
