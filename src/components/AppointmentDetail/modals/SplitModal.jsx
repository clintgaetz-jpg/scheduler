import React, { useState } from 'react';
import { X, Scissors, AlertCircle } from 'lucide-react';

// ============================================
// SPLIT MODAL
// Placeholder - Full implementation in Phase 6
// ============================================

export default function SplitModal({ 
  appointment, 
  technicians, 
  onClose, 
  onSplit 
}) {
  const [selectedLines, setSelectedLines] = useState([]);
  
  const services = appointment.services || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Scissors className="text-purple-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Split Job</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          
          {/* Coming Soon Notice */}
          <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg mb-6">
            <AlertCircle className="text-purple-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-purple-900">Split Feature Coming Soon</h3>
              <p className="text-sm text-purple-700 mt-1">
                This will allow you to split service lines across different technicians, 
                dates, or send specific work to hold while keeping other work scheduled.
              </p>
            </div>
          </div>
          
          {/* Preview of what it will look like */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Select lines to split:</h4>
            
            <div className="space-y-2 opacity-50">
              {services.map((service, i) => (
                <div 
                  key={service.id || i}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <input 
                    type="checkbox" 
                    disabled 
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{service.title}</div>
                    <div className="text-xs text-gray-500">{service.hours}h • ${service.total}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    service.status === 'done' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {service.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
            
            {services.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No services to split
              </div>
            )}
          </div>
          
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            disabled
            className="px-4 py-2 bg-purple-600 text-white rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2"
          >
            <Scissors size={16} />
            Create Split
          </button>
        </div>
        
      </div>
    </div>
  );
}
