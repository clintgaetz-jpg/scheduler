import React from 'react';
import { X, Calendar, Clock, User, Car } from 'lucide-react';

// ============================================
// APPOINTMENT LIST MODAL
// Shows filtered list of appointments
// ============================================

export default function AppointmentListModal({
  isOpen,
  onClose,
  title,
  appointments = [],
  onSelectAppointment
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Car size={48} className="mx-auto mb-4 opacity-30" />
              <p>No appointments found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map(appt => (
                <button
                  key={appt.id}
                  onClick={() => onSelectAppointment(appt)}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {appt.customer_name}
                      </div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        {appt.vehicle_description}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {appt.scheduled_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {appt.estimated_hours}h
                        </span>
                        {appt.tech_id && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {appt.tech_name || 'Assigned'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      {appt.workorder_number && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          WO# {appt.workorder_number}
                        </span>
                      )}
                      {appt.is_on_hold && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          On Hold
                        </span>
                      )}
                      {appt.parts_ordered && !appt.parts_arrived && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          Parts Pending
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {appt.services && appt.services.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {appt.services.slice(0, 3).map((s, i) => (
                        <span key={i}>
                          {i > 0 && ' • '}
                          {s.name}
                        </span>
                      ))}
                      {appt.services.length > 3 && (
                        <span className="text-gray-400"> +{appt.services.length - 3} more</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="text-sm text-gray-500 text-center">
            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
