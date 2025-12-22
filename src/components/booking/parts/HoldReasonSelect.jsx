import React from 'react';
import { Package, Lock, UserX, Calendar, HelpCircle } from 'lucide-react';

// ============================================
// HoldReasonSelect Component
// Dropdown to select why appointment is on hold
// ============================================

const HOLD_REASONS = [
  { value: 'parts', label: 'Waiting for Parts', icon: Package, color: 'text-blue-600' },
  { value: 'auth', label: 'Needs Authorization', icon: Lock, color: 'text-amber-600' },
  { value: 'customer', label: 'Customer Request', icon: UserX, color: 'text-purple-600' },
  { value: 'scheduling', label: 'Scheduling - No Tech/Date', icon: Calendar, color: 'text-gray-600' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-gray-500' }
];

export function HoldReasonSelect({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-amber-700 mb-1.5">Hold Reason</label>
      <div className="grid grid-cols-2 gap-2">
        {HOLD_REASONS.map(reason => {
          const Icon = reason.icon;
          const isSelected = value === reason.value;
          
          return (
            <button
              key={reason.value}
              onClick={() => onChange(reason.value)}
              className={`
                px-3 py-2 rounded-lg border text-left text-sm transition-colors
                flex items-center gap-2
                ${isSelected 
                  ? 'bg-amber-100 border-amber-400 text-amber-800' 
                  : 'bg-white border-gray-200 hover:border-amber-300 text-gray-700'
                }
              `}
            >
              <Icon size={14} className={isSelected ? 'text-amber-600' : reason.color} />
              <span className="truncate">{reason.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HoldReasonSelect;
