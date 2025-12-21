import React from 'react';
import { Search, Loader } from 'lucide-react';

// ============================================
// CustomerSearch Component
// Search input with results dropdown
// ============================================

export function CustomerSearch({ value, onChange, results, onSelect, searching }) {
  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
        {searching && (
          <Loader size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((customer) => (
            <button
              key={customer.id}
              onClick={() => onSelect(customer)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="font-medium text-gray-900">{customer.file_as}</div>
              <div className="text-sm text-gray-500 flex gap-3">
                {customer.primary_phone && <span>{customer.primary_phone}</span>}
                {customer.company_name && <span>{customer.company_name}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerSearch;
