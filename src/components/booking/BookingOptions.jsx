import React, { useState } from 'react';
import { 
  Clock, Car, Navigation, Coffee, Moon, 
  ChevronDown, AlertCircle 
} from 'lucide-react';

// ============================================
// BookingOptions Component
// Handles waiter, loaner, ride, pickup preferences
// 
// Props:
//   value      - { waitingType, pickupBy, needsLoaner, needsRide, ... }
//   onChange   - callback
//   timeSlot   - current time slot selection
//   settings   - scheduler settings (waiter limits, etc.)
// ============================================

export function BookingOptions({ 
  value = {}, 
  onChange, 
  timeSlot,
  settings = {} 
}) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (field, val) => {
    onChange?.({ ...value, [field]: val });
  };

  // Waiting type options
  const waitingTypes = [
    { value: 'drop_off', label: 'Drop & Leave', icon: Car, desc: 'Standard drop-off' },
    { value: 'waiter', label: 'Waiter', icon: Coffee, desc: 'Customer waits' },
    { value: 'soft_waiter', label: 'Soft Waiter', icon: Clock, desc: 'In town, waiting till done' },
    { value: 'overnight', label: 'Overnight', icon: Moon, desc: 'After-hours pickup' },
    { value: 'loaner', label: 'In Loaner', icon: Car, desc: 'Has loaner vehicle' }
  ];

  // Auto-expand if waiter selected
  const showWaiterWarning = timeSlot === 'waiter' || value.waitingType === 'waiter';
  const waiterSlots = settings.waiter_slots || ['08:00', '13:00'];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 bg-gray-50 flex items-center justify-between text-sm hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-gray-700">
          <Car size={14} />
          <span>Booking Options</span>
          {/* Show summary of selected options */}
          {(value.waitingType || value.needsLoaner || value.needsRide || value.pickupBy) && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {getOptionsSummary(value)}
            </span>
          )}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="p-3 space-y-4 border-t border-gray-200">
          
          {/* Waiting Type */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">
              Customer Waiting Preference
            </label>
            <div className="grid grid-cols-2 gap-2">
              {waitingTypes.map(type => {
                const Icon = type.icon;
                const isSelected = value.waitingType === type.value;
                
                return (
                  <button
                    key={type.value}
                    onClick={() => handleChange('waitingType', type.value)}
                    className={`
                      px-3 py-2 rounded-lg border text-left text-sm transition-colors
                      ${isSelected 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                      {type.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Waiter time selection - show if waiter selected */}
          {(value.waitingType === 'waiter' || timeSlot === 'waiter') && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle size={14} className="text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <div className="font-medium">Waiter Appointment</div>
                  <div className="text-xs">
                    Max {settings.waiter_limits?.max_per_day || 2} per day. 
                    Slots: {waiterSlots.map(s => formatTime(s)).join(', ')}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {waiterSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => handleChange('waiterSlot', slot)}
                    className={`
                      flex-1 px-3 py-2 rounded-lg border text-sm
                      ${value.waiterSlot === slot 
                        ? 'bg-amber-100 border-amber-400 text-amber-800' 
                        : 'bg-white border-amber-200 hover:border-amber-300'
                      }
                    `}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pickup Time - show if not waiter/overnight */}
          {value.waitingType !== 'waiter' && value.waitingType !== 'overnight' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Needs Vehicle Back By (optional)
              </label>
              <input
                type="time"
                value={value.pickupBy || ''}
                onChange={(e) => handleChange('pickupBy', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 15:00"
              />
            </div>
          )}

          {/* Transportation Options */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">
              Transportation Needs
            </label>
            <div className="flex flex-wrap gap-2">
              <ToggleChip
                label="Needs Loaner"
                icon={Car}
                checked={value.needsLoaner}
                onChange={(v) => handleChange('needsLoaner', v)}
              />
              <ToggleChip
                label="Needs Ride/Shuttle"
                icon={Navigation}
                checked={value.needsRide}
                onChange={(v) => handleChange('needsRide', v)}
              />
              <ToggleChip
                label="Call Taxi"
                icon={Navigation}
                checked={value.needsTaxi}
                onChange={(v) => handleChange('needsTaxi', v)}
              />
            </div>
          </div>

          {/* Drop-off Time - for scheduling advisor time */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Drop-off Appointment Time (optional)
            </label>
            <input
              type="time"
              value={value.dropoffTime || ''}
              onChange={(e) => handleChange('dropoffTime', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="When customer will arrive"
            />
            <p className="text-xs text-gray-400 mt-1">
              When customer will arrive to meet with advisor
            </p>
          </div>

        </div>
      )}
    </div>
  );
}

// ============================================
// ToggleChip - Small toggle button
// ============================================
function ToggleChip({ label, icon: Icon, checked, onChange }) {
  return (
    <button
      onClick={() => onChange?.(!checked)}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
        ${checked 
          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
          : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
        }
      `}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

// ============================================
// Helpers
// ============================================

function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes || '00'} ${ampm}`;
}

function getOptionsSummary(value) {
  const parts = [];
  if (value.waitingType) {
    const labels = {
      drop_off: 'Drop',
      waiter: 'Waiter',
      soft_waiter: 'Soft Wait',
      overnight: 'Overnight',
      loaner: 'Loaner'
    };
    parts.push(labels[value.waitingType] || value.waitingType);
  }
  if (value.pickupBy) parts.push(`by ${formatTime(value.pickupBy)}`);
  if (value.needsLoaner) parts.push('Loaner');
  if (value.needsRide) parts.push('Ride');
  if (value.needsTaxi) parts.push('Taxi');
  return parts.join(' • ');
}

export default BookingOptions;
