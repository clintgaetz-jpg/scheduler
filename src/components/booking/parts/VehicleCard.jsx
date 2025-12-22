import React, { useState } from 'react';
import { 
  Car, ChevronDown, ChevronRight, AlertTriangle, 
  CheckCircle, Clock, Gauge, Calendar, FileText,
  AlertCircle
} from 'lucide-react';

// ============================================
// VehicleCard Component
// Shows vehicle in fleet list with status and history preview
// ============================================

export function VehicleCard({ 
  vehicle, 
  isSelected, 
  onSelect, 
  compact = false,
  inactive = false 
}) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    recent: { 
      bg: 'bg-green-50', 
      border: 'border-green-200', 
      badge: 'bg-green-100 text-green-700',
      icon: CheckCircle,
      label: 'OK'
    },
    due_soon: { 
      bg: 'bg-amber-50', 
      border: 'border-amber-200', 
      badge: 'bg-amber-100 text-amber-700',
      icon: Clock,
      label: 'DUE SOON'
    },
    overdue: { 
      bg: 'bg-red-50', 
      border: 'border-red-200', 
      badge: 'bg-red-100 text-red-700',
      icon: AlertTriangle,
      label: 'OVERDUE'
    }
  };

  const status = statusConfig[vehicle.service_status] || statusConfig.recent;
  const StatusIcon = status.icon;

  const formatKm = (km) => {
    if (!km) return null;
    return km.toLocaleString() + ' km';
  };

  const formatDaysAgo = (days) => {
    if (days === null || days === undefined) return null;
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${(days / 365).toFixed(1)}yr ago`;
  };

  const hasDeferredWork = vehicle.last_3_invoices?.some(inv => inv.deferred?.length > 0);

  if (compact) {
    return (
      <button
        onClick={onSelect}
        className={`
          w-full p-2 rounded-lg border text-left transition-all
          ${isSelected 
            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
            : `${status.bg} ${status.border} hover:border-gray-400`
          }
          ${inactive ? 'opacity-60' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-800">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </div>
          <span className={`text-xs px-1.5 py-0.5 rounded ${status.badge}`}>
            {formatDaysAgo(vehicle.days_since_service)}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div
      className={`
        rounded-lg border transition-all overflow-hidden
        ${isSelected 
          ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' 
          : `${status.bg} ${status.border} hover:border-gray-400`
        }
      `}
    >
      <div className="flex items-stretch">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="px-2 flex items-center justify-center hover:bg-black/5 border-r border-gray-200"
        >
          {expanded ? (
            <ChevronDown size={14} className="text-gray-400" />
          ) : (
            <ChevronRight size={14} className="text-gray-400" />
          )}
        </button>

        <button
          onClick={onSelect}
          className="flex-1 p-3 text-left"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Car size={16} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
              <span className="font-semibold text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </span>
              {vehicle.color && (
                <span className="text-xs text-gray-500">({vehicle.color})</span>
              )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${status.badge}`}>
              <StatusIcon size={10} />
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-sm">
            {vehicle.plate && (
              <span className="font-mono bg-white/70 px-1.5 py-0.5 rounded border border-gray-200 text-xs">
                {vehicle.plate}
              </span>
            )}
            {vehicle.unit_number && (
              <span className="text-gray-500 text-xs">Unit #{vehicle.unit_number}</span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
            {vehicle.last_mileage && (
              <span className="flex items-center gap-1">
                <Gauge size={12} className="text-gray-400" />
                Last: {formatKm(vehicle.last_mileage)}
              </span>
            )}
            {vehicle.estimated_current_mileage && (
              <span className="flex items-center gap-1">
                → Est: {formatKm(vehicle.estimated_current_mileage)}
                {vehicle.avg_daily_km && (
                  <span className="text-gray-400">(+{Math.round(vehicle.avg_daily_km)}/day)</span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1 text-gray-600">
              <Calendar size={12} className="text-gray-400" />
              {vehicle.days_since_service != null 
                ? formatDaysAgo(vehicle.days_since_service)
                : 'No history'
              }
            </span>
            {vehicle.km_since_service != null && (
              <span className="text-gray-500">
                ~{formatKm(vehicle.km_since_service)} since service
              </span>
            )}
            {hasDeferredWork && (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <AlertCircle size={12} />
                Deferred work
              </span>
            )}
          </div>

          {vehicle.service_due_summary && vehicle.service_status !== 'recent' && (
            <div className={`mt-2 text-xs font-medium ${
              vehicle.service_status === 'overdue' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {vehicle.service_due_summary}
            </div>
          )}
        </button>
      </div>

      {expanded && vehicle.last_3_invoices && vehicle.last_3_invoices.length > 0 && (
        <div className="border-t border-gray-200 bg-white/50">
          {vehicle.last_3_invoices.map((invoice, idx) => (
            <div 
              key={invoice.workorder_number || idx}
              className="px-4 py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">
                  WO# {invoice.workorder_number}
                </span>
                <div className="flex items-center gap-3 text-gray-500">
                  <span>{invoice.invoice_date}</span>
                  <span className="font-medium text-gray-700">
                    ${invoice.grand_total?.toLocaleString()}
                  </span>
                </div>
              </div>

              {invoice.deferred && invoice.deferred.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {invoice.deferred.filter(d => !d.is_header).map((def, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between text-xs bg-amber-50 px-2 py-1 rounded border border-amber-200"
                    >
                      <span className="flex items-center gap-1 text-amber-700">
                        <AlertTriangle size={10} />
                        {def.title}
                      </span>
                      <span className="font-medium text-amber-800">
                        ${def.total?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {vehicle.open_workorder && (
        <div className="px-3 py-2 bg-blue-100 border-t border-blue-200 text-xs">
          <div className="flex items-center gap-2 text-blue-800">
            <FileText size={12} />
            <span className="font-medium">OPEN WO: #{vehicle.open_workorder.workorder_number}</span>
            <span>— {vehicle.open_workorder.status}</span>
            <span className="ml-auto font-medium">
              ${vehicle.open_workorder.package_total?.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleCard;
