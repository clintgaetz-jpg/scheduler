import React from 'react';

// ============================================
// LED COLOR CONFIGURATIONS
// ============================================
const LED_COLORS = {
  off: {
    base: '#2a2a2a',
    glow: 'transparent',
    shadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
  },
  green: {
    base: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.8)',
    shadow: null
  },
  yellow: {
    base: '#eab308',
    glow: 'rgba(234, 179, 8, 0.8)',
    shadow: null
  },
  red: {
    base: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.8)',
    shadow: null
  },
  blue: {
    base: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.8)',
    shadow: null
  },
  orange: {
    base: '#f97316',
    glow: 'rgba(249, 115, 22, 0.8)',
    shadow: null
  }
};

// ============================================
// LED INDICATOR - Rectangle style
// ============================================
export function LEDIndicator({ 
  status = 'off', 
  size = 'sm',
  label,
  pulse = false,
  blink = false 
}) {
  const colors = LED_COLORS[status] || LED_COLORS.off;
  const isOn = status !== 'off';
  
  // Size configurations
  const sizes = {
    sm: { w: 8, h: 16 },
    md: { w: 12, h: 24 },
    lg: { w: 16, h: 32 }
  };
  const { w, h } = sizes[size] || sizes.sm;

  // Build box shadow for LED effect
  const buildShadow = () => {
    if (!isOn) {
      return 'inset 0 1px 3px rgba(0,0,0,0.5)';
    }
    return `
      inset 0 0 ${h * 0.4}px ${colors.glow},
      inset 0 0 3px rgba(255,255,255,0.3),
      0 0 ${w * 0.5}px 2px ${colors.glow},
      0 0 ${w}px 4px ${colors.glow.replace('0.8', '0.5')},
      0 0 ${w * 2}px 6px ${colors.glow.replace('0.8', '0.25')}
    `;
  };

  const animationClass = blink ? 'animate-pulse' : pulse ? 'animate-pulse' : '';

  return (
    <div className="flex items-center gap-1.5">
      {/* LED housing (bezel) */}
      <div 
        className="rounded-sm"
        style={{
          padding: '2px',
          background: 'linear-gradient(180deg, #555 0%, #333 50%, #222 100%)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        {/* LED element */}
        <div
          className={`rounded-sm transition-all duration-300 ${animationClass}`}
          style={{
            width: w,
            height: h,
            backgroundColor: colors.base,
            boxShadow: buildShadow(),
            background: isOn 
              ? `linear-gradient(160deg, ${colors.base} 0%, ${colors.base} 50%, ${colors.base}dd 100%)`
              : `linear-gradient(160deg, #3a3a3a 0%, #2a2a2a 50%, #1a1a1a 100%)`
          }}
        >
          {/* Highlight reflection */}
          {isOn && (
            <div 
              style={{
                width: '35%',
                height: '20%',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)',
                borderRadius: '50%',
                marginLeft: '15%',
                marginTop: '10%'
              }}
            />
          )}
        </div>
      </div>
      
      {/* Optional label */}
      {label && (
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      )}
    </div>
  );
}

// ============================================
// LED STRIP - Horizontal compact row
// ============================================
export function LEDStrip({ statuses = [] }) {
  return (
    <div 
      className="inline-flex items-center gap-1 px-1.5 py-1 rounded"
      style={{
        background: 'linear-gradient(180deg, #444 0%, #333 50%, #222 100%)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      {statuses.map((s, i) => (
        <LEDIndicator 
          key={i} 
          status={s.status} 
          size="sm" 
          pulse={s.pulse}
          blink={s.blink}
        />
      ))}
    </div>
  );
}

// ============================================
// APPOINTMENT STATUS LEDs
// Pre-configured for appointment workflow
// ============================================
export function AppointmentStatusLEDs({ appointment, compact = true }) {
  if (!appointment) return null;

  // Determine LED states based on appointment data
  const getWOStatus = () => {
    if (appointment.workorder_created || appointment.workorder_number) return 'green';
    return 'yellow'; // Needs WO
  };

  const getAuthStatus = () => {
    if (!appointment.workorder_created && !appointment.workorder_number) return 'off';
    if (appointment.authorized) return 'green';
    return 'yellow'; // Has WO but not authorized
  };

  const getDeferredStatus = () => {
    if (appointment.has_deferred_work) {
      if (appointment.deferred_reviewed) return 'green';
      return 'yellow';
    }
    return 'off';
  };

  const getPartsStatus = () => {
    // Check if any service needs parts
    const needsParts = appointment.parts_needed || 
      appointment.services?.some(s => s.hold_reason === 'parts');
    
    if (!needsParts && !appointment.parts_ordered) return 'off';
    if (appointment.parts_arrived) return 'green';
    if (appointment.parts_ordered) return 'yellow';
    return 'red'; // Needs parts but not ordered
  };

  const statuses = [
    { status: getWOStatus(), label: 'WO', pulse: false },
    { status: getAuthStatus(), label: 'Auth', pulse: false },
    { status: getDeferredStatus(), label: 'Def', pulse: false },
    { status: getPartsStatus(), label: 'Parts', pulse: getPartsStatus() === 'red', blink: getPartsStatus() === 'red' }
  ];

  if (compact) {
    return <LEDStrip statuses={statuses} />;
  }

  // Full panel with labels
  return (
    <div 
      className="inline-flex flex-col gap-2 p-2 rounded"
      style={{
        background: 'linear-gradient(180deg, #444 0%, #333 50%, #222 100%)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      {statuses.map((s, i) => (
        <LEDIndicator 
          key={i} 
          status={s.status} 
          size="sm" 
          label={s.label}
          pulse={s.pulse}
          blink={s.blink}
        />
      ))}
    </div>
  );
}

export default LEDIndicator;
