import React from 'react';

function MiniLED({ status, label, pulse = false }) {
  const colors = {
    off: 'bg-gray-300',
    green: 'bg-emerald-500 shadow-emerald-500/50',
    yellow: 'bg-amber-400 shadow-amber-400/50',
    red: 'bg-red-500 shadow-red-500/50',
    blue: 'bg-blue-500 shadow-blue-500/50'
  };

  const classes = [
    'w-2 h-2 rounded-full',
    colors[status] || colors.off,
    status !== 'off' ? 'shadow-sm' : '',
    pulse ? 'animate-pulse' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="flex items-center gap-1" title={label}>
      <div className={classes} />
    </div>
  );
}

export function AppointmentStatusLEDs({ appointment }) {
  if (!appointment) return null;
  
  const getWOStatus = () => {
    if (appointment.authorized) return 'green';
    if (appointment.workorder_created) return 'yellow';
    return 'off';
  };

  const getPartsStatus = () => {
    const ps = appointment.parts_status;
    if (ps === 'arrived') return 'green';
    if (ps === 'partial' || ps === 'ordered') return 'yellow';
    if (ps === 'needed') return 'red';
    return 'off';
  };

  const getVehicleStatus = () => {
    return appointment.vehicle_here ? 'green' : 'off';
  };

  return (
    <div className="flex items-center gap-1.5">
      <MiniLED status={getWOStatus()} label={appointment.authorized ? 'Authorized' : 'No WO'} />
      <MiniLED status={getVehicleStatus()} label={appointment.vehicle_here ? 'Here' : 'Not Here'} />
      <MiniLED status={getPartsStatus()} label={'Parts: ' + (appointment.parts_status || 'none')} />
    </div>
  );
}

export default AppointmentStatusLEDs;

