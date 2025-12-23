import React, { useState } from 'react';
import { Car, Hash, Gauge, Calendar, Clipboard, Copy, Check } from 'lucide-react';

// ============================================
// VEHICLE CARD
// VIN, plate, mileage, notes
// ============================================

export default function VehicleCard({ appointment, onUpdate }) {
  const [copiedVin, setCopiedVin] = useState(false);
  
  const copyVin = async () => {
    if (appointment.vehicle_vin) {
      await navigator.clipboard.writeText(appointment.vehicle_vin);
      setCopiedVin(true);
      setTimeout(() => setCopiedVin(false), 2000);
    }
  };

  const formatMileage = (mileage) => {
    if (!mileage) return null;
    const num = parseInt(mileage);
    if (isNaN(num)) return mileage;
    return num.toLocaleString() + ' km';
  };

  return (
    <div className="space-y-3">
      
      {/* Section Header */}
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <Car size={12} />
        Vehicle
      </h3>
      
      {/* Year Make Model */}
      <div className="font-medium text-gray-900">
        {appointment.vehicle_year && `${appointment.vehicle_year} `}
        {appointment.vehicle_make && `${appointment.vehicle_make} `}
        {appointment.vehicle_model}
        {!appointment.vehicle_year && !appointment.vehicle_make && !appointment.vehicle_model && (
          <span className="text-gray-400 italic">No vehicle info</span>
        )}
      </div>
      
      {/* Submodel/Engine */}
      {(appointment.vehicle_submodel || appointment.vehicle_engine) && (
        <div className="text-sm text-gray-500">
          {appointment.vehicle_submodel}
          {appointment.vehicle_submodel && appointment.vehicle_engine && ' • '}
          {appointment.vehicle_engine}
        </div>
      )}
      
      {/* VIN - with copy button */}
      {appointment.vehicle_vin && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded px-2 py-1.5 min-w-0">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">VIN</div>
            <div className="font-mono text-xs text-gray-700 truncate">
              {appointment.vehicle_vin}
            </div>
          </div>
          <button
            onClick={copyVin}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
            title="Copy VIN"
          >
            {copiedVin ? (
              <Check size={14} className="text-green-600" />
            ) : (
              <Copy size={14} className="text-gray-400" />
            )}
          </button>
        </div>
      )}
      
      {/* License Plate & Unit Number Row */}
      <div className="flex items-center gap-3">
        {/* Plate */}
        {appointment.vehicle_plate && (
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
              <span className="font-bold text-blue-800 tracking-wide text-sm">
                {appointment.vehicle_plate.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        
        {/* Unit Number (fleet) */}
        {appointment.unit_number && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Hash size={14} className="text-gray-400" />
            <span>Unit #{appointment.unit_number}</span>
          </div>
        )}
      </div>
      
      {/* Mileage */}
      {formatMileage(appointment.vehicle_mileage) && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Gauge size={14} className="text-gray-400" />
          <span>{formatMileage(appointment.vehicle_mileage)}</span>
        </div>
      )}
      
      {/* Last Service Date (for vehicle) */}
      {appointment.last_service_date && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span>Last: {new Date(appointment.last_service_date).toLocaleDateString()}</span>
        </div>
      )}
      
      {/* Vehicle Notes */}
      {appointment.vehicle_notes && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
          <div className="flex items-start gap-1.5">
            <Clipboard size={12} className="flex-shrink-0 mt-0.5" />
            <span>{appointment.vehicle_notes}</span>
          </div>
        </div>
      )}
      
    </div>
  );
}
