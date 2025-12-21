/**
 * LED Indicator Components
 * 
 * Shared status LED components used across the app.
 * 
 * Usage:
 *   import { MiniLED, LEDStrip } from '@/components/ui/LEDIndicator';
 */

import React from 'react';
import { LED_COLORS } from '../../utils/constants';

// ============================================
// MINI LED - Small dot indicator
// ============================================

export function MiniLED({ status = 'off', pulse = false, size = 'sm', title = '' }) {
  const sizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };
  
  const config = LED_COLORS[status] || LED_COLORS.off;
  
  return (
    <div 
      className={`
        ${sizes[size]} 
        rounded-full 
        ${config.bg}
        ${status !== 'off' ? `shadow-sm ${config.glow}` : ''}
        ${pulse && status !== 'off' ? 'animate-pulse' : ''}
        transition-all duration-200
      `}
      title={title}
    />
  );
}

// ============================================
// LED STRIP - Horizontal row of status LEDs
// ============================================

export function LEDStrip({ statuses = [], size = 'sm', gap = 1.5 }) {
  return (
    <div className={`flex items-center gap-${gap}`}>
      {statuses.map((item, idx) => (
        <MiniLED 
          key={idx}
          status={item.status}
          pulse={item.pulse}
          size={size}
          title={item.label}
        />
      ))}
    </div>
  );
}

// ============================================
// LED WITH LABEL - LED dot with text label
// ============================================

export function LEDWithLabel({ 
  status = 'off', 
  label, 
  pulse = false, 
  size = 'sm',
  vertical = false 
}) {
  return (
    <div className={`flex items-center gap-1.5 ${vertical ? 'flex-col' : ''}`}>
      <MiniLED status={status} pulse={pulse} size={size} />
      {label && (
        <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
}

// ============================================
// LED BUTTON - Clickable LED that toggles state
// ============================================

export function LEDButton({ 
  status = 'off', 
  label, 
  onClick, 
  disabled = false,
  size = 'md',
  showLabel = true
}) {
  const config = LED_COLORS[status] || LED_COLORS.off;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-2 py-1 rounded-md
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}
      `}
      title={label}
    >
      <MiniLED status={status} size={size} />
      {showLabel && label && (
        <span className="text-xs font-medium text-gray-700">{label}</span>
      )}
    </button>
  );
}

// ============================================
// APPOINTMENT STATUS LEDS - Standard set for appointments
// ============================================

export function AppointmentStatusLEDs({ appointment, compact = true }) {
  const getWOStatus = () => {
    if (appointment?.authorized) return 'green';
    if (appointment?.workorder_created) return 'yellow';
    return 'off';
  };

  const getPartsStatus = () => {
    const ps = appointment?.parts_status;
    if (ps === 'arrived') return 'green';
    if (ps === 'partial') return 'orange';
    if (ps === 'ordered') return 'yellow';
    if (ps === 'needed') return 'red';
    return 'off';
  };

  const getVehicleStatus = () => {
    if (appointment?.vehicle_here) return 'green';
    return 'off';
  };

  const getDeferredStatus = () => {
    if (appointment?.deferred_reviewed) return 'green';
    if (appointment?.has_deferred) return 'yellow';
    return 'off';
  };

  const statuses = [
    { 
      status: getWOStatus(), 
      label: appointment?.authorized ? 'Authorized' : appointment?.workorder_created ? 'WO Created' : 'No WO',
      pulse: false
    },
    { 
      status: getVehicleStatus(), 
      label: appointment?.vehicle_here ? 'On Site' : 'Not Here',
      pulse: false
    },
    { 
      status: getPartsStatus(), 
      label: `Parts: ${appointment?.parts_status || 'none'}`,
      pulse: appointment?.parts_status === 'needed'
    },
    { 
      status: getDeferredStatus(), 
      label: appointment?.deferred_reviewed ? 'Deferred Reviewed' : 'Deferred',
      pulse: false
    },
  ];

  if (compact) {
    return <LEDStrip statuses={statuses} size="sm" />;
  }

  return (
    <div className="flex flex-col gap-1">
      {statuses.map((item, idx) => (
        <LEDWithLabel key={idx} {...item} />
      ))}
    </div>
  );
}

export default MiniLED;
