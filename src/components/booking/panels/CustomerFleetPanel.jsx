import React, { useState } from 'react';
import { 
  Search, X, User, Phone, Mail, MapPin, Building2, 
  ChevronDown, Clock, AlertTriangle, Plus,
  MessageSquare
} from 'lucide-react';
import { VehicleCard } from '../parts/VehicleCard';
import { CustomerNotesSection } from '../parts/CustomerNotesSection';

// ============================================
// CustomerFleetPanel - Left Panel
// Shows customer info and fleet overview
// ============================================

const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

export function CustomerFleetPanel({
  customer,
  vehicles = [],
  inactiveVehicles = [],
  selectedVehicle,
  onSelectCustomer,
  onClearCustomer,
  onSelectVehicle,
  onAddNewVehicle,
  onUpdateVehicle,
  loading,
  vehicleSort,
  onChangeVehicleSort
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Customer search
  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/search_customers_v2`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ search_term: term })
        }
      );
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setSearching(false);
  };

  // Select customer and load full context
  const handleSelectCustomer = async (result) => {
    setSearchTerm('');
    setSearchResults([]);
    
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/get_customer_booking_context`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ p_customer_id: result.id })
        }
      );
      const data = await res.json();
      
      const fullCustomer = {
        ...data.customer,
        vehicles: data.vehicles || [],
        open_workorders: data.open_workorders || []
      };
      
      onSelectCustomer(fullCustomer);
    } catch (err) {
      console.error('Failed to load customer context:', err);
      onSelectCustomer(result);
    }
  };

  if (!customer) {
    return (
      <div className="p-4 h-full flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Customer
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Name, phone, or company..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            autoFocus
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-lg shadow-lg bg-white max-h-[400px] overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectCustomer(result)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
              >
                <div className="font-medium text-gray-900">{result.file_as}</div>
                {result.company_name && result.company_name !== result.file_as && (
                  <div className="text-sm text-gray-500">{result.company_name}</div>
                )}
                <div className="text-sm text-gray-500">{result.primary_phone}</div>
              </button>
            ))}
          </div>
        )}

        {searchTerm.length >= 2 && searchResults.length === 0 && !searching && (
          <div className="mt-4 text-center text-gray-500 py-8">
            <User size={32} className="mx-auto mb-2 opacity-30" />
            <p>No customers found</p>
            <button className="mt-2 text-blue-600 text-sm hover:underline">
              + Add New Customer
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Customer Card */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-lg">{customer.file_as}</h3>
              <button
                onClick={onClearCustomer}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Change customer"
              >
                <X size={14} />
              </button>
            </div>
            {customer.company_name && customer.company_name !== customer.file_as && (
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Building2 size={12} />
                {customer.company_name}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1 text-sm">
          {customer.primary_phone && (
            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={12} className="text-gray-400" />
              <a href={`tel:${customer.primary_phone}`} className="hover:text-blue-600">
                {customer.primary_phone}
              </a>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={12} className="text-gray-400" />
              <a href={`mailto:${customer.email}`} className="hover:text-blue-600 truncate">
                {customer.email}
              </a>
            </div>
          )}
          {(customer.street || customer.city) && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={12} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {[customer.street, customer.city, customer.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs">
          {customer.customer_since && (
            <span className="text-gray-500">
              <span className="font-semibold text-gray-700">
                {new Date(customer.customer_since).getFullYear()}
              </span> client
            </span>
          )}
          {customer.lifetime_visits > 0 && (
            <span className="text-gray-500">
              <span className="font-semibold text-gray-700">{customer.lifetime_visits}</span> visits
            </span>
          )}
          {customer.lifetime_spent > 0 && (
            <span className="text-gray-500">
              <span className="font-semibold text-gray-700">
                ${customer.lifetime_spent.toLocaleString()}
              </span> total
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {customer.prefers_call && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
              <Phone size={10} /> Call
            </span>
          )}
          {customer.prefers_text && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs flex items-center gap-1">
              <MessageSquare size={10} /> Text
            </span>
          )}
          {customer.prefers_email && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs flex items-center gap-1">
              <Mail size={10} /> Email
            </span>
          )}
          {customer.is_supplier && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
              Supplier
            </span>
          )}
        </div>
      </div>

      <CustomerNotesSection 
        notes={customer.notes}
        aiSummary={customer.ai_summary}
        communicationHistory={customer.communication_history}
      />

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between sticky top-0">
          <span className="text-sm font-medium text-gray-700">
            Vehicles ({vehicles.length + (inactiveVehicles?.length || 0)})
          </span>
          <div className="flex items-center gap-2">
            <select
              value={vehicleSort}
              onChange={(e) => onChangeVehicleSort(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="most_overdue">Most Overdue</option>
              <option value="last_visit">Last Visit</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
            <button
              onClick={onAddNewVehicle}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Add new vehicle"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {selectedVehicle?.isNew && (
          <div className="p-3 m-3 bg-blue-50 rounded-lg border-2 border-blue-300">
            <div className="text-xs font-medium text-blue-800 mb-2">New Vehicle</div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <input
                type="text"
                value={selectedVehicle.year || ''}
                onChange={(e) => onUpdateVehicle({ year: e.target.value })}
                placeholder="Year"
                maxLength={4}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
              <input
                type="text"
                value={selectedVehicle.make || ''}
                onChange={(e) => onUpdateVehicle({ make: e.target.value })}
                placeholder="Make"
                className="border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
              <input
                type="text"
                value={selectedVehicle.model || ''}
                onChange={(e) => onUpdateVehicle({ model: e.target.value })}
                placeholder="Model"
                className="border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={selectedVehicle.plate || ''}
                onChange={(e) => onUpdateVehicle({ plate: e.target.value.toUpperCase() })}
                placeholder="Plate"
                className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
              />
              <input
                type="text"
                value={selectedVehicle.vin || ''}
                onChange={(e) => onUpdateVehicle({ vin: e.target.value.toUpperCase() })}
                placeholder="VIN"
                maxLength={17}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
              />
            </div>
            <button
              onClick={() => onSelectVehicle(null)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              ← Cancel
            </button>
          </div>
        )}

        <div className="p-2 space-y-2">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.vin || vehicle.vehicle_id}
              vehicle={vehicle}
              isSelected={selectedVehicle?.vin === vehicle.vin}
              onSelect={() => onSelectVehicle(vehicle)}
              compact={false}
            />
          ))}
        </div>

        {inactiveVehicles && inactiveVehicles.length > 0 && (
          <div className="border-t border-gray-200">
            <button
              onClick={() => setShowInactive(!showInactive)}
              className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 flex items-center justify-between"
            >
              <span>Inactive ({inactiveVehicles.length})</span>
              <ChevronDown size={14} className={`transition-transform ${showInactive ? 'rotate-180' : ''}`} />
            </button>
            {showInactive && (
              <div className="p-2 space-y-2 opacity-60">
                {inactiveVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.vin || vehicle.vehicle_id}
                    vehicle={vehicle}
                    isSelected={selectedVehicle?.vin === vehicle.vin}
                    onSelect={() => onSelectVehicle(vehicle)}
                    compact={true}
                    inactive={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {vehicles.length === 0 && !selectedVehicle?.isNew && (
          <div className="p-8 text-center text-gray-400">
            <AlertTriangle size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No vehicles on file</p>
            <button
              onClick={onAddNewVehicle}
              className="mt-2 text-blue-600 text-sm hover:underline"
            >
              + Add New Vehicle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerFleetPanel;
