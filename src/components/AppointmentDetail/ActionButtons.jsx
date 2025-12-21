import React from 'react';
import { 
  Car, UserX, XCircle, RotateCcw, Clock, CheckCircle,
  AlertTriangle 
} from 'lucide-react';

// ============================================
// ACTION BUTTONS
// Arrived, No Show, Cancelled, Rebook
// ============================================

export default function ActionButtons({
  appointment,
  onArrived,
  onNoShow,
  onCancelled,
  onRebook,
}) {
  const isArrived = appointment.vehicle_here;
  const isCancelled = appointment.status === 'cancelled';
  const isNoShow = appointment.status === 'no_show';
  const isCompleted = appointment.status === 'completed';

  // If cancelled or no-show, show restore/rebook options
  if (isCancelled || isNoShow) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
          isCancelled ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {isCancelled ? <XCircle size={16} /> : <UserX size={16} />}
          <span className="font-medium text-sm">
            {isCancelled ? 'Cancelled' : 'No Show'}
          </span>
        </div>
        <button
          onClick={onRebook}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RotateCcw size={16} />
          <span className="font-medium text-sm">Rebook</span>
        </button>
      </div>
    );
  }

  // If completed, just show status
  if (isCompleted) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
        <CheckCircle size={16} />
        <span className="font-medium text-sm">Completed</span>
      </div>
    );
  }

  // Normal state - show action buttons
  return (
    <div className="flex items-center gap-2">
      {/* Arrived Button */}
      <button
        onClick={onArrived}
        disabled={isArrived}
        className={`
          flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors
          ${isArrived 
            ? 'bg-green-100 text-green-700 cursor-default' 
            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}
        `}
      >
        <Car size={16} />
        <span className="font-medium text-sm">
          {isArrived ? 'Arrived ✓' : 'Mark Arrived'}
        </span>
      </button>

      {/* No Show Button */}
      <button
        onClick={onNoShow}
        className="flex items-center gap-1.5 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
      >
        <UserX size={16} />
        <span className="font-medium text-sm">No Show</span>
      </button>

      {/* Cancel Button */}
      <button
        onClick={onCancelled}
        className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
      >
        <XCircle size={16} />
        <span className="font-medium text-sm">Cancel</span>
      </button>

      {/* Rebook Button (for rescheduling) */}
      <button
        onClick={onRebook}
        className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <RotateCcw size={16} />
        <span className="font-medium text-sm">Rebook</span>
      </button>
    </div>
  );
}
