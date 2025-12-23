import React from 'react';
import { User, Phone, Mail, MapPin, Building, Star, History } from 'lucide-react';

// ============================================
// CUSTOMER CARD
// Contact info and quick stats
// ============================================

export default function CustomerCard({ appointment, onUpdate }) {
  
  const formatPhone = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits[0] === '1') {
      return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-3">
      
      {/* Section Header */}
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <User size={12} />
        Customer
      </h3>
      
      {/* Name */}
      <div className="font-medium text-gray-900">
        {appointment.customer_name}
      </div>
      
      {/* Company (if different from name) */}
      {appointment.company_name && appointment.company_name !== appointment.customer_name && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building size={14} className="text-gray-400 flex-shrink-0" />
          <span>{appointment.company_name}</span>
        </div>
      )}
      
      {/* Primary Phone */}
      {appointment.customer_phone && (
        <a 
          href={`tel:${appointment.customer_phone}`}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Phone size={14} className="flex-shrink-0" />
          <span>{formatPhone(appointment.customer_phone)}</span>
        </a>
      )}
      
      {/* Secondary Phone */}
      {appointment.customer_phone_secondary && (
        <a 
          href={`tel:${appointment.customer_phone_secondary}`}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <Phone size={14} className="text-gray-400 flex-shrink-0" />
          <span>{formatPhone(appointment.customer_phone_secondary)}</span>
          <span className="text-xs text-gray-400">(alt)</span>
        </a>
      )}
      
      {/* Email */}
      {appointment.customer_email && (
        <a 
          href={`mailto:${appointment.customer_email}`}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Mail size={14} className="flex-shrink-0" />
          <span className="truncate">{appointment.customer_email}</span>
        </a>
      )}
      
      {/* Address */}
      {appointment.customer_address && (
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <span className="leading-snug">{appointment.customer_address}</span>
        </div>
      )}
      
      {/* Customer Stats */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
        {appointment.is_repeat_customer && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <Star size={12} fill="currentColor" />
            Repeat
          </span>
        )}
        {appointment.visit_count > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <History size={12} />
            {appointment.visit_count} visits
          </span>
        )}
        {appointment.customer_lifetime_spent > 0 && (
          <span className="text-xs text-gray-500">
            ${appointment.customer_lifetime_spent?.toLocaleString()} LTV
          </span>
        )}
      </div>
      
      {/* Last Service */}
      {appointment.last_service_date && (
        <div className="text-xs text-gray-400">
          Last service: {new Date(appointment.last_service_date).toLocaleDateString()}
        </div>
      )}
      
    </div>
  );
}
