import React, { useState, useEffect } from 'react';
import { 
  Search, X, User, Phone, Mail, MapPin, Building2, Car,
  ChevronDown, ChevronRight, Clock, AlertTriangle, Plus,
  MessageSquare, Calendar, Trash2, Package, Wrench,
  FileText, DollarSign, History, Check
} from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================

const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

const SHOP_SUPPLIES_RATE = 0.05;
const GST_RATE = 0.05;
const BUFFER_RATE = 0.05;

// ============================================
// MAIN BOOKING MODAL - 4 PANEL LAYOUT
// ============================================

export function BookingModal({
  isOpen,
  onClose,
  onSave,
  technicians = [],
  servicePackages = [],
  selectedDate
}) {
  // Customer state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Vehicle state
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleHistory, setVehicleHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Quote state
  const [quoteItems, setQuoteItems] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    scheduled_date: selectedDate || new Date().toISOString().split('T')[0],
    tech_id: '',
    notes: '',
    is_on_hold: false
  });

  const [saving, setSaving] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setCustomer(null);
      setVehicles([]);
      setSelectedVehicle(null);
      setVehicleHistory(null);
      setQuoteItems([]);
      setFormData({
        scheduled_date: selectedDate || new Date().toISOString().split('T')[0],
        tech_id: '',
        notes: '',
        is_on_hold: false
      });
    }
  }, [isOpen, selectedDate]);

  // ============================================
  // SEARCH & LOAD CUSTOMER
  // ============================================

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
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handleSelectCustomer = async (result) => {
    setSearchTerm('');
    setSearchResults([]);
    setCustomerLoading(true);
    
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
      
      if (data && data.customer) {
        setCustomer(data.customer);
        setVehicles(data.vehicles || []);
        // Auto-select first vehicle if only one
        if (data.vehicles?.length === 1) {
          handleSelectVehicle(data.vehicles[0]);
        }
      } else {
        // Fallback to basic customer data
        setCustomer(result);
        setVehicles([]);
      }
    } catch (err) {
      console.error('Failed to load customer context:', err);
      setCustomer(result);
      setVehicles([]);
    }
    setCustomerLoading(false);
  };

  const handleClearCustomer = () => {
    setCustomer(null);
    setVehicles([]);
    setSelectedVehicle(null);
    setVehicleHistory(null);
    setQuoteItems([]);
  };

  // ============================================
  // VEHICLE SELECTION & HISTORY
  // ============================================

  const handleSelectVehicle = async (vehicle) => {
    // If changing vehicle with items in quote, confirm
    if (selectedVehicle && quoteItems.length > 0 && vehicle.vin !== selectedVehicle.vin) {
      if (!window.confirm('Changing vehicle will clear your quote. Continue?')) {
        return;
      }
      setQuoteItems([]);
    }

    setSelectedVehicle(vehicle);
    setHistoryLoading(true);

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/get_vehicle_full_history`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ p_vin: vehicle.vin })
        }
      );
      const data = await res.json();
      setVehicleHistory(data);
    } catch (err) {
      console.error('Failed to load vehicle history:', err);
      setVehicleHistory(null);
    }
    setHistoryLoading(false);
  };

  const handleAddNewVehicle = () => {
    const newVehicle = {
      isNew: true,
      vin: '',
      year: '',
      make: '',
      model: '',
      plate: '',
      color: ''
    };
    setSelectedVehicle(newVehicle);
    setVehicleHistory(null);
  };

  // ============================================
  // QUOTE MANAGEMENT
  // ============================================

  const addToQuote = (item) => {
    // Check for duplicates
    const exists = quoteItems.find(q => 
      q.title === item.title && q.source_wo === item.source_wo
    );
    if (exists) return;

    setQuoteItems([...quoteItems, {
      ...item,
      id: Date.now(),
      hours: item.labor_hours || 1,
      total: item.total || 0
    }]);
  };

  const removeFromQuote = (id) => {
    setQuoteItems(quoteItems.filter(q => q.id !== id));
  };

  const updateQuoteItem = (id, updates) => {
    setQuoteItems(quoteItems.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  // Calculate totals
  const subtotal = quoteItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const shopSupplies = subtotal * SHOP_SUPPLIES_RATE;
  const gst = (subtotal + shopSupplies) * GST_RATE;
  const buffer = subtotal * BUFFER_RATE;
  const estimatedTotal = subtotal + shopSupplies + gst + buffer;
  const totalHours = quoteItems.reduce((sum, item) => sum + (item.hours || 0), 0);

  // ============================================
  // SAVE APPOINTMENT
  // ============================================

  const handleSave = async () => {
    if (!customer) {
      alert('Please select a customer');
      return;
    }
    if (!selectedVehicle) {
      alert('Please select a vehicle');
      return;
    }
    if (!formData.is_on_hold && !formData.tech_id) {
      alert('Please select a technician or save to Hold');
      return;
    }

    setSaving(true);

    const appointmentData = {
      // Customer
      customer_id: customer.id,
      customer_name: customer.file_as,
      customer_phone: customer.primary_phone,
      customer_email: customer.email,
      company_name: customer.company_name,
      
      // Vehicle
      vehicle_id: selectedVehicle.vehicle_id,
      vehicle_vin: selectedVehicle.vin,
      vehicle_year: selectedVehicle.year,
      vehicle_make: selectedVehicle.make,
      vehicle_model: selectedVehicle.model,
      vehicle_plate: selectedVehicle.plate,
      vehicle_color: selectedVehicle.color,
      vehicle_description: `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`,
      vehicle_mileage: selectedVehicle.last_mileage,
      
      // Scheduling
      scheduled_date: formData.is_on_hold ? null : formData.scheduled_date,
      tech_id: formData.is_on_hold ? null : formData.tech_id,
      estimated_hours: totalHours || 1,
      
      // Hold
      is_on_hold: formData.is_on_hold,
      hold_reason: formData.is_on_hold ? 'scheduling' : null,
      
      // Services
      services: quoteItems,
      estimated_total: estimatedTotal,
      
      // Notes
      notes: formData.notes,
      
      // Status
      status: formData.is_on_hold ? 'hold' : 'scheduled',
      source: 'manual'
    };

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(appointmentData)
      });
      
      const result = await res.json();
      
      if (Array.isArray(result) && result.length > 0) {
        onSave && onSave(result[0]);
        onClose();
      } else {
        console.error('Save failed:', result);
        alert('Failed to save appointment');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save appointment');
    }
    
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[98vw] h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            New Appointment
            {customer && <span className="text-gray-500 font-normal"> — {customer.file_as}</span>}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>

        {/* 4 Panel Grid */}
        <div className="flex-1 grid grid-cols-4 gap-0 overflow-hidden">
          {/* Panel 1: Customer */}
          <Panel1Customer
            customer={customer}
            searchTerm={searchTerm}
            searchResults={searchResults}
            searching={searching}
            loading={customerLoading}
            onSearch={handleSearch}
            onSelectCustomer={handleSelectCustomer}
            onClearCustomer={handleClearCustomer}
          />

          {/* Panel 2: Vehicles */}
          <Panel2Vehicles
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={handleSelectVehicle}
            onAddNewVehicle={handleAddNewVehicle}
            disabled={!customer}
          />

          {/* Panel 3: History & Services */}
          <Panel3HistoryServices
            vehicleHistory={vehicleHistory}
            servicePackages={servicePackages}
            loading={historyLoading}
            onAddToQuote={addToQuote}
            disabled={!selectedVehicle}
          />

          {/* Panel 4: Quote & Booking */}
          <Panel4QuoteBooking
            quoteItems={quoteItems}
            onRemoveItem={removeFromQuote}
            onUpdateItem={updateQuoteItem}
            subtotal={subtotal}
            shopSupplies={shopSupplies}
            gst={gst}
            buffer={buffer}
            estimatedTotal={estimatedTotal}
            totalHours={totalHours}
            technicians={technicians}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onCancel={onClose}
            saving={saving}
            disabled={!selectedVehicle}
            selectedVehicle={selectedVehicle}
            onChangeVehicle={() => setSelectedVehicle(null)}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// PANEL 1: CUSTOMER SEARCH & INFO
// ============================================

function Panel1Customer({
  customer,
  searchTerm,
  searchResults,
  searching,
  loading,
  onSearch,
  onSelectCustomer,
  onClearCustomer
}) {
  if (loading) {
    return (
      <div className="border-r border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p>Loading customer...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="border-r border-gray-200 p-4 flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Customer
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
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
                onClick={() => onSelectCustomer(result)}
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
          <div className="mt-8 text-center text-gray-500">
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

  // Customer selected - show info
  return (
    <div className="border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Customer Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-start justify-between mb-2">
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
              <span>{customer.primary_phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={12} className="text-gray-400" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {(customer.street || customer.city) && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={12} className="text-gray-400" />
              <span className="truncate">
                {[customer.street, customer.city, customer.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
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

        {/* Preferences */}
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

      {/* Notes Section */}
      {customer.notes && (
        <div className="p-3 border-b border-gray-200 bg-amber-50 flex-shrink-0">
          <div className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
            <AlertTriangle size={12} />
            Shop Notes
          </div>
          <div className="text-sm text-amber-900 whitespace-pre-wrap">{customer.notes}</div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1 bg-gray-50" />
    </div>
  );
}

// ============================================
// PANEL 2: VEHICLES
// ============================================

function Panel2Vehicles({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onAddNewVehicle,
  disabled
}) {
  if (disabled) {
    return (
      <div className="border-r border-gray-200 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <Car size={32} className="mx-auto mb-2 opacity-30" />
          <p>Select a customer first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Selected Vehicle Card (Top) */}
      {selectedVehicle && !selectedVehicle.isNew && (
        <div className="p-3 border-b border-gray-200 bg-blue-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-700">Selected Vehicle</span>
            <button
              onClick={() => onSelectVehicle(null)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Change
            </button>
          </div>
          <div className="font-semibold text-gray-900">
            {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-3">
            {selectedVehicle.plate && <span>Plate: {selectedVehicle.plate}</span>}
            {selectedVehicle.color && <span>{selectedVehicle.color}</span>}
          </div>
          {selectedVehicle.last_mileage && (
            <div className="text-xs text-gray-500 mt-1">
              {selectedVehicle.last_mileage.toLocaleString()} km
              {selectedVehicle.estimated_current_mileage && (
                <span> → est. {selectedVehicle.estimated_current_mileage.toLocaleString()} km</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* New Vehicle Form */}
      {selectedVehicle?.isNew && (
        <div className="p-3 border-b border-gray-200 bg-green-50 flex-shrink-0">
          <div className="text-xs font-medium text-green-700 mb-2">New Vehicle</div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Year"
              maxLength={4}
              value={selectedVehicle.year || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, year: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Make"
              value={selectedVehicle.make || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, make: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Model"
              value={selectedVehicle.model || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, model: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Plate"
              value={selectedVehicle.plate || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, plate: e.target.value.toUpperCase() })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
            />
            <input
              type="text"
              placeholder="VIN"
              maxLength={17}
              value={selectedVehicle.vin || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, vin: e.target.value.toUpperCase() })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
            />
          </div>
          <button
            onClick={() => onSelectVehicle(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            ← Cancel
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-medium text-gray-700">
          Vehicles ({vehicles.length})
        </span>
        <button
          onClick={onAddNewVehicle}
          className="text-blue-600 hover:text-blue-800 p-1"
          title="Add new vehicle"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.vin || vehicle.vehicle_id}
            vehicle={vehicle}
            isSelected={selectedVehicle?.vin === vehicle.vin && !selectedVehicle?.isNew}
            onSelect={() => onSelectVehicle(vehicle)}
          />
        ))}

        {vehicles.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Car size={24} className="mx-auto mb-2 opacity-50" />
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

// ============================================
// VEHICLE CARD COMPONENT
// ============================================

function VehicleCard({ vehicle, isSelected, onSelect }) {
  const getStatusBadge = () => {
    const status = vehicle.service_status;
    if (status === 'overdue') {
      return <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">OVERDUE</span>;
    }
    if (status === 'due_soon') {
      return <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">DUE SOON</span>;
    }
    return null;
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </div>
          {vehicle.color && (
            <span className="text-sm text-gray-500">({vehicle.color})</span>
          )}
        </div>
        {getStatusBadge()}
      </div>

      <div className="mt-1 text-xs text-gray-500 space-y-0.5">
        {vehicle.plate && <div>Plate: {vehicle.plate}</div>}
        {vehicle.last_mileage && (
          <div>Last: {vehicle.last_mileage.toLocaleString()} km</div>
        )}
        {vehicle.days_since_service !== null && (
          <div>
            {vehicle.days_since_service === 0 
              ? 'Serviced today'
              : `${vehicle.days_since_service} days ago`
            }
          </div>
        )}
      </div>

      {/* Last 3 invoices preview */}
      {vehicle.last_3_invoices?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          {vehicle.last_3_invoices.slice(0, 2).map((inv, i) => (
            <div key={i} className="text-xs text-gray-500 flex justify-between">
              <span>WO# {inv.workorder_number}</span>
              <span>${inv.grand_total?.toFixed(0)}</span>
            </div>
          ))}
          {vehicle.last_3_invoices.some(inv => inv.deferred?.length > 0) && (
            <div className="text-xs text-amber-600 mt-1">
              ⚠️ Has deferred work
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ============================================
// PANEL 3: HISTORY & SERVICES
// ============================================

function Panel3HistoryServices({
  vehicleHistory,
  servicePackages,
  loading,
  onAddToQuote,
  disabled
}) {
  const [activeTab, setActiveTab] = useState('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedInvoices, setExpandedInvoices] = useState({});

  if (disabled) {
    return (
      <div className="border-r border-gray-200 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <History size={32} className="mx-auto mb-2 opacity-30" />
          <p>Select a vehicle first</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border-r border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  const toggleInvoice = (woNumber) => {
    setExpandedInvoices(prev => ({
      ...prev,
      [woNumber]: !prev[woNumber]
    }));
  };

  // Filter invoices by search
  const filteredInvoices = vehicleHistory?.invoices?.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.workorder_number?.toLowerCase().includes(term) ||
      inv.completed_packages?.some(p => p.title?.toLowerCase().includes(term)) ||
      inv.deferred_packages?.some(p => p.title?.toLowerCase().includes(term))
    );
  }) || [];

  return (
    <div className="border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={14} className="inline mr-1" />
          History
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'services'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package size={14} className="inline mr-1" />
          Services
        </button>
      </div>

      {activeTab === 'history' && (
        <>
          {/* Search */}
          <div className="p-2 border-b border-gray-200 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Stats */}
          {vehicleHistory?.stats && (
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <div className="flex gap-4 text-xs text-gray-600">
                <span><strong>{vehicleHistory.stats.total_invoices}</strong> visits</span>
                <span><strong>${vehicleHistory.stats.total_spent?.toLocaleString()}</strong> total</span>
                <span>Avg: <strong>${vehicleHistory.stats.avg_invoice?.toFixed(0)}</strong></span>
              </div>
            </div>
          )}

          {/* Invoice List */}
          <div className="flex-1 overflow-y-auto">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.workorder_number}
                invoice={invoice}
                expanded={expandedInvoices[invoice.workorder_number]}
                onToggle={() => toggleInvoice(invoice.workorder_number)}
                onAddToQuote={onAddToQuote}
              />
            ))}

            {filteredInvoices.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <FileText size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No history found</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'services' && (
        <div className="flex-1 overflow-y-auto p-2">
          <ServicePackageList
            packages={servicePackages}
            onAddToQuote={onAddToQuote}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// INVOICE CARD COMPONENT
// ============================================

function InvoiceCard({ invoice, expanded, onToggle, onAddToQuote }) {
  const hasDeferred = invoice.deferred_packages?.length > 0;

  return (
    <div className="border-b border-gray-100">
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
      >
        <ChevronRight 
          size={14} 
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} 
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">WO# {invoice.workorder_number}</span>
            <span className="text-sm font-medium">${invoice.grand_total?.toFixed(0)}</span>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>{invoice.invoice_date}</span>
            {invoice.mileage && <span>{invoice.mileage.toLocaleString()} km</span>}
            {hasDeferred && <span className="text-amber-600">⚠️ Deferred</span>}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 pb-3 ml-6">
          {/* Completed Packages */}
          {invoice.completed_packages?.map((pkg, i) => (
            <div key={i} className="flex items-center justify-between py-1 text-sm border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Check size={12} className="text-green-500" />
                <span>{pkg.title}</span>
              </div>
              <span className="text-gray-600">${pkg.total?.toFixed(0)}</span>
            </div>
          ))}

          {/* Deferred Packages */}
          {invoice.deferred_packages?.filter(p => !p.is_header).map((pkg, i) => (
            <div key={i} className="flex items-center justify-between py-1 text-sm bg-amber-50 px-2 rounded mt-1">
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-500" />
                <span className="text-amber-800">{pkg.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-700">${pkg.total?.toFixed(0)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToQuote(pkg);
                  }}
                  className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded text-xs hover:bg-amber-300"
                >
                  + Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// SERVICE PACKAGE LIST
// ============================================

function ServicePackageList({ packages, onAddToQuote }) {
  const grouped = packages?.reduce((acc, pkg) => {
    const cat = pkg.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(pkg);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, pkgs]) => (
        <div key={category}>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">{category}</div>
          <div className="space-y-1">
            {pkgs.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => onAddToQuote({
                  title: pkg.name,
                  total: pkg.base_price || 0,
                  labor_hours: pkg.base_hours || 1,
                  source: 'package'
                })}
                className="w-full flex items-center justify-between p-2 text-sm bg-white border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50"
              >
                <span>{pkg.name}</span>
                <div className="flex items-center gap-2 text-gray-500">
                  <span>${pkg.base_price?.toFixed(0)}</span>
                  <span className="text-xs">{pkg.base_hours}h</span>
                  <Plus size={14} className="text-blue-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// PANEL 4: QUOTE & BOOKING
// ============================================

function Panel4QuoteBooking({
  quoteItems,
  onRemoveItem,
  onUpdateItem,
  subtotal,
  shopSupplies,
  gst,
  buffer,
  estimatedTotal,
  totalHours,
  technicians,
  formData,
  setFormData,
  onSave,
  onCancel,
  saving,
  disabled,
  selectedVehicle,
  onChangeVehicle
}) {
  if (disabled) {
    return (
      <div className="flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
          <p>Select a vehicle to build quote</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Header with vehicle */}
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-medium text-gray-700">Quote & Booking</span>
        {selectedVehicle && (
          <button
            onClick={onChangeVehicle}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Change Vehicle
          </button>
        )}
      </div>

      {/* Quote Items */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-medium text-gray-500 mb-2">
          Services ({quoteItems.length}) — {totalHours.toFixed(1)}h
        </div>

        {quoteItems.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Package size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No services added</p>
            <p className="text-xs">Select from history or packages</p>
          </div>
        ) : (
          <div className="space-y-2">
            {quoteItems.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-gray-500">
                    {item.hours}h · ${item.total?.toFixed(0)}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals - Compact */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Sub: ${subtotal.toFixed(0)}</span>
          <span>+Supplies: ${shopSupplies.toFixed(0)}</span>
          <span>+GST: ${gst.toFixed(0)}</span>
          <span>+Buffer: ${buffer.toFixed(0)}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-semibold">Estimate</span>
          <span className="text-xl font-bold text-green-600">${estimatedTotal.toFixed(0)}</span>
        </div>
      </div>

      {/* Booking Form */}
      <div className="p-4 border-t border-gray-200 space-y-3 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              disabled={formData.is_on_hold}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Technician</label>
            <select
              value={formData.tech_id}
              onChange={(e) => setFormData({ ...formData, tech_id: e.target.value })}
              disabled={formData.is_on_hold}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="">Select tech...</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Appointment notes..."
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_on_hold}
            onChange={(e) => setFormData({ ...formData, is_on_hold: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Save to Hold</span>
        </label>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Calendar size={16} />
              Book Appointment
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default BookingModal;
