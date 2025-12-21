import React from 'react';
import { Car, Hash, Gauge, Calendar, Clipboard, Copy, Check } from 'lucide-react';

// ============================================
// VEHICLE PANEL
// Shows vehicle info - VIN, YMM, plate, mileage
// ============================================

export default function VehiclePanel({ appointment, onUpdate }) {
  const [copiedVin, setCopiedVin] = React.useState(false);
  
  const copyVin = async () => {
    if (appointment.vehicle_vin) {
      await navigator.clipboard.writeText(appointment.vehicle_vin);
      setCopiedVin(true);
      setTimeout(() => setCopiedVin(false), 2000);
    }
  };

  const formatMileage = (mileage) => {
    if (!mileage) return '';
    const num = parseInt(mileage);
    if (isNaN(num)) return mileage;
    return num.toLocaleString() + ' km';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        <Car size={12} />
        Vehicle
      </h3>
      
      {/* Year Make Model */}
      <div className="text-sm font-medium text-gray-900">
        {appointment.vehicle_year && `${appointment.vehicle_year} `}
        {appointment.vehicle_make && `${appointment.vehicle_make} `}
        {appointment.vehicle_model}
      </div>
      
      {/* Full description if different */}
      {appointment.vehicle_description && 
       appointment.vehicle_description !== `${appointment.vehicle_year} ${appointment.vehicle_make} ${appointment.vehicle_model}` && (
        <div className="text-xs text-gray-500">
          {appointment.vehicle_description}
        </div>
      )}
      
      {/* VIN - with copy button */}
      {appointment.vehicle_vin && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded px-2 py-1.5">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">VIN</div>
            <div className="font-mono text-xs text-gray-700 break-all">
              {appointment.vehicle_vin}
            </div>
          </div>
          <button
            onClick={copyVin}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
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
      
      {/* License Plate */}
      {appointment.vehicle_plate && (
        <div className="flex items-center gap-2 text-sm">
          <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
            <span className="font-bold text-blue-800 tracking-wide">
              {appointment.vehicle_plate.toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-gray-400">Plate</span>
        </div>
      )}
      
      {/* Unit Number (for fleets) */}
      {appointment.unit_number && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Hash size={14} className="text-gray-400" />
          <span>Unit #{appointment.unit_number}</span>
        </div>
      )}
      
      {/* Mileage */}
      {appointment.vehicle_mileage && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Gauge size={14} className="text-gray-400" />
          <span>{formatMileage(appointment.vehicle_mileage)}</span>
        </div>
      )}
      
      {/* Last Service Date */}
      {appointment.last_service_date && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span>Last service: {appointment.last_service_date}</span>
        </div>
      )}
      
      {/* Vehicle Notes */}
      {appointment.vehicle_notes && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
          <Clipboard size={12} className="inline mr-1" />
          {appointment.vehicle_notes}
        </div>
      )}
    </div>
  );
}
