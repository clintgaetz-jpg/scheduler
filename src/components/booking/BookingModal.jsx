import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, X, User, Phone, Mail, MapPin, Building2, Car,
  ChevronDown, ChevronRight, Clock, AlertTriangle, Plus,
  MessageSquare, Calendar, Trash2, Package, Wrench,
  FileText, DollarSign, History, Check, Edit, Star
} from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================

const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

const SHOP_SUPPLIES_RATE = 0.05;
const GST_RATE = 0.05;
const BUFFER_RATE = 0.05;
const LABOR_RATE = 160;

// ============================================
// HELPER: Format VIN with emphasis
// ============================================
function formatVIN(vin) {
  if (!vin || vin.length !== 17) return vin || '—';
  return (
    <span className="font-mono text-xs">
      {vin.slice(0, 7)}
      <span className="font-bold text-sm">{vin[7]}</span>
      {vin[8]}
      <span className="font-bold text-sm">{vin[9]}</span>
      {vin.slice(10, 11)}
      <span className="font-bold text-sm">{vin.slice(11)}</span>
    </span>
  );
}

// ============================================
// MAIN BOOKING MODAL - 4 PANEL LAYOUT v3
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
  const [newCustomer, setNewCustomer] = useState(null); // For new customer form
  const [editingCustomer, setEditingCustomer] = useState(null); // For editing existing customer

  // Workorder search state
  const [woSearchTerm, setWoSearchTerm] = useState('');
  const [woSearchResults, setWoSearchResults] = useState([]);
  const [woSearching, setWoSearching] = useState(false);
  const [selectedWorkorder, setSelectedWorkorder] = useState(null); // Direct WO booking mode

  // Vehicle state
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleHistory, setVehicleHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');

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
      setNewCustomer(null);
      setEditingCustomer(null);
      setVehicles([]);
      setSelectedVehicle(null);
      setVehicleHistory(null);
      setQuoteItems([]);
      setVehicleSearchTerm('');
      setWoSearchTerm('');
      setWoSearchResults([]);
      setSelectedWorkorder(null);
      setFormData({
        scheduled_date: selectedDate || new Date().toISOString().split('T')[0],
        tech_id: '',
        notes: '',
        is_on_hold: false
      });
    }
  }, [isOpen, selectedDate]);

  // ============================================
  // WORKORDER SEARCH
  // ============================================

  const handleWoSearch = async (term) => {
    setWoSearchTerm(term);
    if (term.length < 2) {
      setWoSearchResults([]);
      return;
    }
    
    setWoSearching(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/v_available_workorders?or=(workorder_number.ilike.*${term}*,customer_name.ilike.*${term}*,company_name.ilike.*${term}*)&limit=10`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      const data = await res.json();
      setWoSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('WO Search failed:', err);
      setWoSearchResults([]);
    }
    setWoSearching(false);
  };

  const handleSelectWorkorder = (wo) => {
    setSelectedWorkorder(wo);
    setWoSearchTerm('');
    setWoSearchResults([]);
    // Clear customer search stuff
    setCustomer(null);
    setNewCustomer(null);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleClearWorkorder = () => {
    setSelectedWorkorder(null);
  };

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
        if (data.vehicles?.length === 1) {
          handleSelectVehicle(data.vehicles[0]);
        }
      } else {
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
    setNewCustomer(null);
    setVehicles([]);
    setSelectedVehicle(null);
    setVehicleHistory(null);
    setQuoteItems([]);
  };

  const handleAddNewCustomer = () => {
    setNewCustomer({
      isNew: true,
      first_name: '',
      last_name: '',
      company_name: '',
      primary_phone: '',
      secondary_phone: '',
      email: '',
      street: '',
      city: '',
      state: 'AB',
      zip: '',
      country: 'Canada',
      notes: '',
      prefers_call: true,
      prefers_text: true,
      prefers_email: true
    });
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleCancelNewCustomer = () => {
    setNewCustomer(null);
  };

  const handleUpdateCustomer = () => {
    // Copy current customer data to editable state
    setEditingCustomer({
      ...customer,
      isEditing: true
    });
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
  };

  const handleSaveEdit = () => {
    // Apply edited data back to customer (locally, not to DB)
    setCustomer({
      ...customer,
      ...editingCustomer,
      _wasEdited: true  // Flag to track edits
    });
    setEditingCustomer(null);
  };

  // ============================================
  // VEHICLE SELECTION & HISTORY
  // ============================================

  const handleSelectVehicle = async (vehicle) => {
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

  const handleChangeVehicle = () => {
    if (quoteItems.length > 0) {
      if (!window.confirm('Changing vehicle will clear your quote. Continue?')) {
        return;
      }
      setQuoteItems([]);
    }
    setSelectedVehicle(null);
    setVehicleHistory(null);
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

  // Filter vehicles by search
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearchTerm) return vehicles;
    const term = vehicleSearchTerm.toLowerCase();
    return vehicles.filter(v => 
      v.year?.toString().includes(term) ||
      v.make?.toLowerCase().includes(term) ||
      v.model?.toLowerCase().includes(term) ||
      v.plate?.toLowerCase().includes(term) ||
      v.unit_number?.toLowerCase().includes(term) ||
      v.vin?.toLowerCase().includes(term)
    );
  }, [vehicles, vehicleSearchTerm]);

  // ============================================
  // QUOTE MANAGEMENT
  // ============================================

  const addToQuote = (item) => {
    const exists = quoteItems.find(q => 
      q.title === item.title && q.source_wo === item.source_wo
    );
    if (exists) return;

    // Full line structure matching Protractor format for consistency
    const lineWithDefaults = {
      // === IDENTITY ===
      id: Date.now(),
      protractor_line_id: item.protractor_line_id || null,
      
      // === WHAT ===
      title: item.title || '',
      description: item.description || null,
      code: item.code || null,
      template_id: item.template_id || null,
      chapter: item.chapter || 'Service',
      source: item.source || 'package',  // package | history | protractor | custom
      source_wo: item.source_wo || null,
      
      // === LABOR ===
      labor_hours: item.labor_hours || item.hours || 1,
      labor_rate: item.labor_rate || LABOR_RATE,
      labor_total: item.labor_total || 0,
      
      // === PARTS (totals) ===
      parts_total: item.parts_total || 0,
      parts_cost: item.parts_cost || item.cost || 0,
      
      // === TOTALS ===
      total: item.total || 0,
      cost: item.cost || 0,
      margin: item.margin || 0,
      margin_percent: item.margin_percent || 0,
      
      // === LINE STATUS ===
      status: 'pending',  // pending | in_progress | done | hold
      completed_at: null,
      completed_by: null,
      
      // === ASSIGNMENT (for splitting) ===
      tech_id: null,       // null = use appointment's tech
      scheduled_date: null, // null = use appointment's date
      
      // === PARTS DETAIL ===
      parts_status: 'none',  // none | needed | ordered | partial | here
      parts_watch_po: null,
      parts: [],  // Individual parts for this line
      
      // === NOTES ===
      tech_notes: item.tech_notes || null,
      line_notes: null,
      
      // === LEGACY (keep for display) ===
      hours: item.labor_hours || item.hours || 1
    };

    setQuoteItems([...quoteItems, lineWithDefaults]);
  };

  const removeFromQuote = (id) => {
    setQuoteItems(quoteItems.filter(q => q.id !== id));
  };

  // Calculate totals
  const subtotal = quoteItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const shopSupplies = subtotal * SHOP_SUPPLIES_RATE;
  const gst = (subtotal + shopSupplies) * GST_RATE;
  const buffer = subtotal * BUFFER_RATE;
  const estimatedTotal = subtotal + shopSupplies + gst + buffer;
  const totalHours = quoteItems.reduce((sum, item) => sum + (item.labor_hours || item.hours || 0), 0);

  // ============================================
  // SAVE APPOINTMENT
  // ============================================

  const handleSave = async () => {
    // WORKORDER MODE - Skip customer/vehicle validation
    if (selectedWorkorder) {
      if (!formData.is_on_hold && !formData.tech_id) {
        alert('Please select a technician or save to Hold');
        return;
      }
      
      setSaving(true);
      
      const appointmentData = {
        source: 'workorder',
        workorder_number: selectedWorkorder.workorder_number,
        workorder_created: true,
        customer_name: selectedWorkorder.customer_name || selectedWorkorder.company_name,
        company_name: selectedWorkorder.company_name,
        vehicle_description: selectedWorkorder.vehicle_description,
        vehicle_vin: selectedWorkorder.vehicle_vin,
        estimated_total: selectedWorkorder.package_total || 0,
        estimated_hours: selectedWorkorder.line_count || 1,
        scheduled_date: formData.is_on_hold ? null : formData.scheduled_date,
        tech_id: formData.is_on_hold ? null : (formData.tech_id || null),
        notes: formData.notes || null,
        status: formData.is_on_hold ? 'hold' : 'scheduled',
        is_on_hold: formData.is_on_hold || false,
        hold_reason: formData.is_on_hold ? 'scheduling' : null,
        hold_at: formData.is_on_hold ? new Date().toISOString() : null
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
        
        if (!res.ok) {
          console.error('Save failed:', result);
          alert(`Failed to save appointment:\n${result.message || result.error || JSON.stringify(result)}`);
          setSaving(false);
          return;
        }
        
        if (Array.isArray(result) && result.length > 0) {
          onSave && onSave(result[0]);
          onClose();
        }
      } catch (err) {
        console.error('Save error:', err);
        alert(`Failed to save appointment:\n${err.message}`);
      }
      
      setSaving(false);
      return;
    }
    
    // NORMAL MODE - Customer/Vehicle required
    // Determine which customer data to use
    const customerData = newCustomer?.isNew ? newCustomer : customer;
    
    if (!customerData) {
      alert('Please select or create a customer');
      return;
    }
    
    // Validate new customer
    if (newCustomer?.isNew) {
      if (!newCustomer.first_name?.trim() || !newCustomer.last_name?.trim()) {
        alert('Please enter customer first and last name');
        return;
      }
      if (!newCustomer.primary_phone?.trim()) {
        alert('Please enter customer phone number');
        return;
      }
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

    // Build customer name for new customers
    const customerName = newCustomer?.isNew 
      ? (newCustomer.company_name?.trim() || `${newCustomer.last_name}, ${newCustomer.first_name}`)
      : customerData.file_as;

    // Build vehicle description
    const vehicleDesc = [selectedVehicle.year, selectedVehicle.make, selectedVehicle.model]
      .filter(Boolean).join(' ');

    // Map to APPOINTMENTS-TABLE-SCHEMA.md columns
    const appointmentData = {
      // ============================================
      // CORE IDENTIFIERS
      // ============================================
      source: 'manual',

      // ============================================
      // CUSTOMER INFO
      // ============================================
      customer_id: customerData.id || null,
      customer_name: customerName || null,
      customer_phone: customerData.primary_phone || null,
      customer_phone_secondary: customerData.secondary_phone || null,
      customer_email: customerData.email || null,
      customer_address: [customerData.street, customerData.city, customerData.state, customerData.zip]
        .filter(Boolean).join(', ') || null,
      company_name: customerData.company_name || null,
      protractor_contact_id: customerData.protractor_contact_id || null,

      // ============================================
      // EXTENDED CUSTOMER FIELDS
      // ============================================
      customer_first_name: customerData.first_name || null,
      customer_last_name: customerData.last_name || null,
      customer_street: customerData.street || null,
      customer_city: customerData.city || null,
      customer_state: customerData.state || null,
      customer_zip: customerData.zip || null,
      customer_country: customerData.country || 'Canada',
      customer_since: customerData.customer_since || null,
      customer_lifetime_visits: customerData.lifetime_visits || null,
      customer_lifetime_spent: customerData.lifetime_spent || null,
      customer_avg_visit_value: customerData.avg_visit_value || null,
      customer_last_visit_date: customerData.last_visit_date || null,
      customer_days_since_visit: customerData.days_since_visit || null,

      // ============================================
      // CUSTOMER PREFERENCES
      // ============================================
      customer_prefers_call: customerData.prefers_call !== false,
      customer_prefers_text: customerData.prefers_text !== false,
      customer_prefers_email: customerData.prefers_email !== false,
      customer_is_supplier: customerData.is_supplier || false,

      // ============================================
      // CUSTOMER FLAGS
      // ============================================
      is_new_customer: newCustomer?.isNew || false,
      is_repeat_customer: !newCustomer?.isNew && !!customerData.id,

      // ============================================
      // VEHICLE INFO
      // ============================================
      vehicle_id: selectedVehicle.vehicle_id || null,
      vehicle_description: vehicleDesc || null,
      vehicle_vin: selectedVehicle.vin || null,
      vehicle_year: selectedVehicle.year ? parseInt(selectedVehicle.year) : null,
      vehicle_make: selectedVehicle.make || null,
      vehicle_model: selectedVehicle.model || null,
      vehicle_submodel: selectedVehicle.submodel || null,
      vehicle_engine: selectedVehicle.engine || null,
      vehicle_color: selectedVehicle.color || null,
      vehicle_plate: selectedVehicle.plate || null,
      vehicle_mileage: selectedVehicle.mileage || selectedVehicle.last_mileage || null,
      vehicle_mileage_estimated: selectedVehicle.estimated_current_mileage || null,
      vehicle_unit_number: selectedVehicle.unit_number || null,
      is_new_vehicle: selectedVehicle.isNew || false,

      // ============================================
      // SCHEDULING
      // ============================================
      scheduled_date: formData.is_on_hold ? null : formData.scheduled_date,
      tech_id: formData.is_on_hold ? null : (formData.tech_id || null),
      estimated_hours: totalHours || 1,
      service_category: quoteItems[0]?.category || null,

      // ============================================
      // WORK DETAILS
      // ============================================
      services: quoteItems,
      estimated_total: estimatedTotal,
      notes: formData.notes || null,

      // ============================================
      // STATUS
      // ============================================
      status: formData.is_on_hold ? 'hold' : 'scheduled',

      // ============================================
      // HOLD TRACKING
      // ============================================
      is_on_hold: formData.is_on_hold || false,
      hold_reason: formData.is_on_hold ? 'scheduling' : null,
      hold_at: formData.is_on_hold ? new Date().toISOString() : null
    };

    console.log('Saving appointment:', appointmentData);

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
      
      if (!res.ok) {
        // Supabase error response
        console.error('Save failed:', result);
        const errorMsg = result.message || result.error || JSON.stringify(result);
        alert(`Failed to save appointment:\n${errorMsg}`);
        setSaving(false);
        return;
      }
      
      if (Array.isArray(result) && result.length > 0) {
        onSave && onSave(result[0]);
        onClose();
      } else {
        console.error('Save failed - unexpected response:', result);
        alert('Failed to save appointment - unexpected response');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert(`Failed to save appointment:\n${err.message}`);
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
          <Panel1Customer
            customer={customer}
            newCustomer={newCustomer}
            onNewCustomerChange={setNewCustomer}
            editingCustomer={editingCustomer}
            onEditingCustomerChange={setEditingCustomer}
            searchTerm={searchTerm}
            searchResults={searchResults}
            searching={searching}
            loading={customerLoading}
            onSearch={handleSearch}
            onSelectCustomer={handleSelectCustomer}
            onClearCustomer={handleClearCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onAddNewCustomer={handleAddNewCustomer}
            onCancelNewCustomer={handleCancelNewCustomer}
            woSearchTerm={woSearchTerm}
            woSearchResults={woSearchResults}
            woSearching={woSearching}
            selectedWorkorder={selectedWorkorder}
            onWoSearch={handleWoSearch}
            onSelectWorkorder={handleSelectWorkorder}
            onClearWorkorder={handleClearWorkorder}
          />

          <Panel2Vehicles
            vehicles={filteredVehicles}
            allVehiclesCount={vehicles.length}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={handleSelectVehicle}
            onChangeVehicle={handleChangeVehicle}
            onAddNewVehicle={handleAddNewVehicle}
            searchTerm={vehicleSearchTerm}
            onSearch={setVehicleSearchTerm}
            disabled={(!customer && !newCustomer) || selectedWorkorder}
            woMode={!!selectedWorkorder}
          />

          <Panel3HistoryServices
            vehicleHistory={vehicleHistory}
            servicePackages={servicePackages}
            loading={historyLoading}
            onAddToQuote={addToQuote}
            disabled={!selectedVehicle || selectedWorkorder}
            woMode={!!selectedWorkorder}
          />

          <Panel4QuoteBooking
            quoteItems={quoteItems}
            onRemoveItem={removeFromQuote}
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
            disabled={!selectedVehicle && !selectedWorkorder}
            selectedWorkorder={selectedWorkorder}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// PANEL 1: CUSTOMER - RESTORED ORIGINAL STYLE
// ============================================

function Panel1Customer({
  customer,
  newCustomer,
  onNewCustomerChange,
  editingCustomer,
  onEditingCustomerChange,
  searchTerm,
  searchResults,
  searching,
  loading,
  onSearch,
  onSelectCustomer,
  onClearCustomer,
  onUpdateCustomer,
  onSaveEdit,
  onCancelEdit,
  onAddNewCustomer,
  onCancelNewCustomer,
  woSearchTerm,
  woSearchResults,
  woSearching,
  selectedWorkorder,
  onWoSearch,
  onSelectWorkorder,
  onClearWorkorder
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

  // Editing Customer Form
  if (editingCustomer?.isEditing) {
    return (
      <div className="border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-200 bg-amber-50 flex-shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-700">Update Customer Info</span>
            <div className="flex gap-2">
              <button
                onClick={onCancelEdit}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={onSaveEdit}
                className="px-2 py-0.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                Apply
              </button>
            </div>
          </div>
          
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="First Name"
              value={editingCustomer.first_name || ''}
              onChange={(e) => onEditingCustomerChange({ ...editingCustomer, first_name: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={editingCustomer.last_name || ''}
              onChange={(e) => onEditingCustomerChange({ ...editingCustomer, last_name: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* Company */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="Company"
              value={editingCustomer.company_name || ''}
              onChange={(e) => onEditingCustomerChange({ ...editingCustomer, company_name: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* Phones */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="tel"
              placeholder="Phone"
              value={editingCustomer.primary_phone || ''}
              onChange={(e) => onEditingCustomerChange({ ...editingCustomer, primary_phone: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="tel"
              placeholder="Alt Phone"
              value={editingCustomer.secondary_phone || ''}
              onChange={(e) => onEditingCustomerChange({ ...editingCustomer, secondary_phone: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* Email */}
          <div className="mb-2">
            <input
              type="email"
              placeholder="Email"
              value={editingCustomer.email || ''}
              onChange={(e) => onEditingCustomerChange({ ...editingCustomer, email: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* Address */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="Street Address"
              value={editingCustomer.street || ''}
              onChange={(e) => onEditingCustomerChange({ ...editingCustomer, street: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* City, Province, Postal */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="City"
              value={editingCustomer.city || ''}
              onChange={(e) => onEditingCustomerChange({ ...editingCustomer, city: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Prov"
              value={editingCustomer.state || ''}
              onChange={(e) => onEditingCustomerChange({ ...editingCustomer, state: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Postal"
              value={editingCustomer.zip || ''}
              onChange={(e) => onEditingCustomerChange({ ...editingCustomer, zip: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* Contact Preferences */}
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={editingCustomer.prefers_call !== false}
                onChange={(e) => onEditingCustomerChange({ ...editingCustomer, prefers_call: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Phone size={10} /> Call
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={editingCustomer.prefers_text !== false}
                onChange={(e) => onEditingCustomerChange({ ...editingCustomer, prefers_text: e.target.checked })}
                className="rounded border-gray-300"
              />
              <MessageSquare size={10} /> Text
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={editingCustomer.prefers_email !== false}
                onChange={(e) => onEditingCustomerChange({ ...editingCustomer, prefers_email: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Mail size={10} /> Email
            </label>
          </div>
        </div>
        
        {/* Info hint */}
        <div className="p-3 text-xs text-gray-500">
          <p className="text-amber-600">Changes saved to this appointment only.</p>
          <p className="mt-1">Update master record in Protractor.</p>
        </div>
        
        <div className="flex-1 bg-gray-50" />
      </div>
    );
  }

  // New Customer Form
  if (newCustomer?.isNew) {
    return (
      <div className="border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-200 bg-green-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">New Customer</span>
            <button
              onClick={onCancelNewCustomer}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ← Cancel
            </button>
          </div>
          
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="First Name *"
              value={newCustomer.first_name || ''}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, first_name: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Last Name *"
              value={newCustomer.last_name || ''}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, last_name: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* Company */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="Company (optional)"
              value={newCustomer.company_name || ''}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, company_name: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* Phones */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="tel"
              placeholder="Phone *"
              value={newCustomer.primary_phone || ''}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, primary_phone: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="tel"
              placeholder="Alt Phone"
              value={newCustomer.secondary_phone || ''}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, secondary_phone: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* Email */}
          <div className="mb-2">
            <input
              type="email"
              placeholder="Email"
              value={newCustomer.email || ''}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, email: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* Address */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="Street Address"
              value={newCustomer.street || ''}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, street: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* City, Province, Postal */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="City"
              value={newCustomer.city || ''}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, city: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Prov"
              value={newCustomer.state || 'AB'}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, state: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Postal"
              value={newCustomer.zip || ''}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, zip: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          
          {/* Notes */}
          <textarea
            placeholder="Notes (optional)"
            value={newCustomer.notes || ''}
            onChange={(e) => onNewCustomerChange({ ...newCustomer, notes: e.target.value })}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm h-12 resize-none"
          />
          
          {/* Contact Preferences */}
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={newCustomer.prefers_call !== false}
                onChange={(e) => onNewCustomerChange({ ...newCustomer, prefers_call: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Phone size={10} /> Call
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={newCustomer.prefers_text !== false}
                onChange={(e) => onNewCustomerChange({ ...newCustomer, prefers_text: e.target.checked })}
                className="rounded border-gray-300"
              />
              <MessageSquare size={10} /> Text
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={newCustomer.prefers_email !== false}
                onChange={(e) => onNewCustomerChange({ ...newCustomer, prefers_email: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Mail size={10} /> Email
            </label>
          </div>
        </div>
        
        {/* Validation hint */}
        <div className="p-3 text-xs text-gray-500">
          <p>* Required fields: First Name, Last Name, Phone</p>
          <p className="mt-1 text-green-600">Customer will be saved when you book the appointment.</p>
        </div>
        
        <div className="flex-1 bg-gray-50" />
      </div>
    );
  }

  // Selected Workorder Mode - Skip customer/vehicle selection
  if (selectedWorkorder) {
    return (
      <div className="border-r border-gray-200 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-blue-700">From Work Order</span>
          <button
            onClick={onClearWorkorder}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Clear"
          >
            <X size={14} />
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-800">WO# {selectedWorkorder.workorder_number}</span>
            <span className="text-xs text-gray-500">{selectedWorkorder.line_count || 0} lines</span>
          </div>
          
          <div className="text-sm font-medium text-gray-900">
            {selectedWorkorder.customer_name || selectedWorkorder.company_name || 'Unknown Customer'}
          </div>
          
          {selectedWorkorder.vehicle_description && (
            <div className="text-sm text-gray-600">
              🚗 {selectedWorkorder.vehicle_description}
            </div>
          )}
          
          {selectedWorkorder.package_total > 0 && (
            <div className="text-sm font-semibold text-green-700">
              ${selectedWorkorder.package_total?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          )}
          
          {selectedWorkorder.promised_date && (
            <div className="text-xs text-gray-500">
              Promised: {new Date(selectedWorkorder.promised_date).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-xs text-amber-800">
            <strong>Quick Book Mode:</strong> Select a date and technician in the last panel to book this workorder directly.
          </div>
        </div>
        
        <div className="flex-1" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="border-r border-gray-200 p-4 flex flex-col overflow-y-auto">
        {/* Customer Search */}
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
          <div className="mt-2 border border-gray-200 rounded-lg shadow-lg bg-white max-h-[200px] overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => onSelectCustomer(result)}
                className="w-full px-4 py-2.5 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
              >
                <div className="font-medium text-gray-900 text-sm">{result.file_as}</div>
                {result.company_name && result.company_name !== result.file_as && (
                  <div className="text-xs text-gray-500">{result.company_name}</div>
                )}
                <div className="text-xs text-gray-500">{result.primary_phone}</div>
              </button>
            ))}
          </div>
        )}

        {searchTerm.length >= 2 && searchResults.length === 0 && !searching && (
          <div className="mt-2 text-center text-gray-500 py-3">
            <p className="text-sm">No customers found</p>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Work Order Search */}
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Open Work Orders
        </label>
        <div className="relative">
          <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={woSearchTerm}
            onChange={(e) => onWoSearch(e.target.value)}
            placeholder="WO#, customer name..."
            className="w-full pl-9 pr-4 py-2.5 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-blue-50"
          />
          {woSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {woSearchResults.length > 0 && (
          <div className="mt-2 border border-blue-200 rounded-lg shadow-lg bg-white max-h-[200px] overflow-y-auto">
            {woSearchResults.map((wo) => (
              <button
                key={wo.workorder_number}
                onClick={() => onSelectWorkorder(wo)}
                className="w-full px-3 py-2.5 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700">WO# {wo.workorder_number}</span>
                  <span className="text-xs text-gray-500">{wo.line_count || 0} lines</span>
                </div>
                <div className="text-sm text-gray-900">{wo.customer_name || wo.company_name}</div>
                {wo.vehicle_description && (
                  <div className="text-xs text-gray-500 truncate">{wo.vehicle_description}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {woSearchTerm.length >= 2 && woSearchResults.length === 0 && !woSearching && (
          <div className="mt-2 text-center text-gray-500 py-2">
            <p className="text-xs">No open work orders found</p>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* New Customer Button - Bigger */}
        <button
          onClick={onAddNewCustomer}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} />
          New Customer
        </button>
      </div>
    );
  }

  // Customer selected - ORIGINAL STYLE RESTORED
  return (
    <div className="border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Customer Card - Original Style */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-lg">{customer.file_as}</h3>
              {customer._wasEdited && (
                <span className="px-1.5 py-0.5 text-xs bg-amber-200 text-amber-800 rounded">
                  Edited
                </span>
              )}
              <button
                onClick={onUpdateCustomer}
                className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 flex items-center gap-1"
                title="Update customer info"
              >
                <Edit size={10} />
                Update
              </button>
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

      {/* Shop Notes - Original Style */}
      {customer.notes && (
        <div className="p-3 border-b border-gray-200 bg-amber-50 flex-shrink-0">
          <div className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
            <AlertTriangle size={12} />
            Shop Notes
          </div>
          <div className="text-sm text-amber-900 whitespace-pre-wrap">{customer.notes}</div>
        </div>
      )}

      <div className="flex-1 bg-gray-50" />
    </div>
  );
}

// ============================================
// PANEL 2: VEHICLES - WITH ADD BUTTON AND SORT
// ============================================

function Panel2Vehicles({
  vehicles,
  allVehiclesCount,
  selectedVehicle,
  onSelectVehicle,
  onChangeVehicle,
  onAddNewVehicle,
  searchTerm,
  onSearch,
  disabled,
  woMode
}) {
  const [sortBy, setSortBy] = useState('recent'); // recent, overdue, alpha

  // Sort vehicles based on selected option
  const sortedVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    
    const sorted = [...vehicles];
    switch (sortBy) {
      case 'overdue':
        // Most overdue first (overdue > due_soon > recent), then by days
        return sorted.sort((a, b) => {
          const statusOrder = { overdue: 0, due_soon: 1, recent: 2 };
          const aOrder = statusOrder[a.service_status] ?? 2;
          const bOrder = statusOrder[b.service_status] ?? 2;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (b.days_since_service || 0) - (a.days_since_service || 0);
        });
      case 'alpha':
        // Alphabetical by year make model
        return sorted.sort((a, b) => {
          const aName = `${a.year} ${a.make} ${a.model}`.toLowerCase();
          const bName = `${b.year} ${b.make} ${b.model}`.toLowerCase();
          return aName.localeCompare(bName);
        });
      case 'recent':
      default:
        // Most recent service first (lowest days_since_service)
        return sorted.sort((a, b) => (a.days_since_service || 999) - (b.days_since_service || 999));
    }
  }, [vehicles, sortBy]);

  if (disabled) {
    return (
      <div className="border-r border-gray-200 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <Car size={32} className="mx-auto mb-2 opacity-30" />
          <p>{woMode ? 'Vehicle from WO' : 'Select a customer first'}</p>
          {woMode && (
            <p className="text-xs mt-1">Skip to booking →</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Sort Buttons */}
      <div className="px-2 py-1.5 border-b border-gray-200 flex gap-1 flex-shrink-0">
        <button
          onClick={() => setSortBy('recent')}
          className={`px-2 py-0.5 text-xs rounded-full ${sortBy === 'recent' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
        >
          Recent
        </button>
        <button
          onClick={() => setSortBy('overdue')}
          className={`px-2 py-0.5 text-xs rounded-full ${sortBy === 'overdue' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
        >
          Overdue
        </button>
        <button
          onClick={() => setSortBy('alpha')}
          className={`px-2 py-0.5 text-xs rounded-full ${sortBy === 'alpha' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
        >
          A-Z
        </button>
      </div>

      {/* Selected Vehicle Display */}
      {selectedVehicle && !selectedVehicle.isNew && (
        <div className="p-3 border-b border-gray-200 bg-blue-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-700">Selected Vehicle</span>
            <button
              onClick={onChangeVehicle}
              className="px-2 py-0.5 text-xs bg-blue-200 text-blue-800 rounded hover:bg-blue-300"
            >
              Change
            </button>
          </div>
          <div className="font-semibold text-gray-900">
            {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
          </div>
          <div className="text-xs text-gray-600 space-y-0.5 mt-1">
            {selectedVehicle.engine && (
              <div className="truncate">Engine: {selectedVehicle.engine}</div>
            )}
            <div className="flex gap-3 flex-wrap">
              {selectedVehicle.plate && <span>Plate: <strong>{selectedVehicle.plate}</strong></span>}
              {selectedVehicle.unit_number && <span>Unit: <strong>{selectedVehicle.unit_number}</strong></span>}
              {selectedVehicle.color && <span>{selectedVehicle.color}</span>}
            </div>
            {selectedVehicle.vin && (
              <div className="mt-1">VIN: {formatVIN(selectedVehicle.vin)}</div>
            )}
          </div>
        </div>
      )}

      {/* New Vehicle Form - EXPANDED */}
      {selectedVehicle?.isNew && (
        <div className="p-3 border-b border-gray-200 bg-green-50 flex-shrink-0">
          <div className="text-xs font-medium text-green-700 mb-2">New Vehicle</div>
          {/* Row 1: Year, Make, Model */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Year *"
              maxLength={4}
              value={selectedVehicle.year || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, year: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Make *"
              value={selectedVehicle.make || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, make: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Model *"
              value={selectedVehicle.model || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, model: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          {/* Row 2: Submodel, Color */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="Submodel (LT, XLT...)"
              value={selectedVehicle.submodel || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, submodel: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Color"
              value={selectedVehicle.color || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, color: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          {/* Row 3: Engine */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="Engine (5.3L V8, 2.0L Turbo...)"
              value={selectedVehicle.engine || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, engine: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          {/* Row 4: Plate, Unit#, Mileage */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Plate"
              value={selectedVehicle.plate || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, plate: e.target.value.toUpperCase() })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
            />
            <input
              type="text"
              placeholder="Unit #"
              value={selectedVehicle.unit_number || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, unit_number: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="Mileage"
              value={selectedVehicle.mileage || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, mileage: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          {/* Row 5: VIN (full width) */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="VIN (17 characters)"
              maxLength={17}
              value={selectedVehicle.vin || ''}
              onChange={(e) => onSelectVehicle({ ...selectedVehicle, vin: e.target.value.toUpperCase() })}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
            />
          </div>
          <button
            onClick={onChangeVehicle}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Cancel
          </button>
        </div>
      )}

      {/* Search & Header with Add Button */}
      <div className="px-2 py-1.5 bg-gray-100 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search vehicles..."
              className="w-full pl-6 pr-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
            />
          </div>
          <span className="text-xs text-gray-500">
            {vehicles.length === allVehiclesCount 
              ? `${vehicles.length}`
              : `${vehicles.length}/${allVehiclesCount}`
            }
          </span>
          <button
            onClick={onAddNewVehicle}
            className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center gap-1"
          >
            <Plus size={12} />
            New Vehicle
          </button>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sortedVehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.vin || vehicle.vehicle_id}
            vehicle={vehicle}
            isSelected={selectedVehicle?.vin === vehicle.vin && !selectedVehicle?.isNew}
            onSelect={() => onSelectVehicle(vehicle)}
          />
        ))}

        {sortedVehicles.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Car size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No vehicles found</p>
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
// VEHICLE CARD - WITH EXPANDABLE INVOICE LINES
// ============================================

function VehicleCard({ vehicle, isSelected, onSelect }) {
  const [expandedWO, setExpandedWO] = useState(null);

  const getStatusIcon = () => {
    const status = vehicle.service_status;
    if (status === 'overdue') return <span className="text-red-500">🔴</span>;
    if (status === 'due_soon') return <span className="text-amber-500">🟡</span>;
    return <span className="text-green-500">🟢</span>;
  };

  const toggleExpand = (woNumber, e) => {
    e.stopPropagation();
    setExpandedWO(expandedWO === woNumber ? null : woNumber);
  };

  return (
    <div className={`rounded-lg border transition-all ${
      isSelected 
        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
        : 'border-gray-200 hover:border-gray-300 bg-white'
    }`}>
      <div className="p-2">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getStatusIcon()}
            <span className="font-medium text-sm text-gray-900 truncate">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={`px-2 py-0.5 text-xs rounded flex-shrink-0 ml-2 ${
              isSelected 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
            }`}
          >
            {isSelected ? 'Selected' : 'Select'}
          </button>
        </div>

        {/* Info Row */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-600">
          {vehicle.plate && <span>Plate: <strong>{vehicle.plate}</strong></span>}
          {vehicle.unit_number && <span>Unit: <strong>{vehicle.unit_number}</strong></span>}
          {vehicle.engine && <span className="text-gray-500 truncate max-w-[100px]">{vehicle.engine}</span>}
        </div>

        {/* Mileage & Service Row */}
        <div className="text-xs text-gray-500 mt-1">
          {vehicle.last_mileage && (
            <span>
              {vehicle.last_mileage.toLocaleString()} km
            </span>
          )}
          {vehicle.estimated_current_mileage && vehicle.estimated_current_mileage > vehicle.last_mileage && (
            <span className="text-blue-500"> → ~{vehicle.estimated_current_mileage.toLocaleString()}</span>
          )}
          {vehicle.days_since_service != null && (
            <span className="ml-2">
              • {vehicle.days_since_service === 0 ? 'Today' : `${vehicle.days_since_service}d ago`}
            </span>
          )}
        </div>

        {/* Last 3 Invoices - EXPANDABLE with completed + deferred */}
        {vehicle.last_3_invoices?.length > 0 && (
          <div className="mt-2 border-t border-gray-100 pt-1 space-y-0.5">
            {vehicle.last_3_invoices.slice(0, 3).map((inv, i) => {
              const isExpanded = expandedWO === inv.workorder_number;
              const completed = inv.completed_packages || [];
              const deferred = (inv.deferred_packages || []).filter(d => !d.is_header);
              const hasContent = completed.length > 0 || deferred.length > 0;
              
              return (
                <div key={i}>
                  {/* Invoice Header - Clickable */}
                  <div 
                    onClick={hasContent ? (e) => toggleExpand(inv.workorder_number, e) : undefined}
                    className={`flex items-center gap-1 text-xs py-0.5 px-1 bg-gray-50 rounded ${hasContent ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  >
                    {hasContent && (
                      <ChevronRight 
                        size={10} 
                        className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} 
                      />
                    )}
                    {!hasContent && <span className="w-2.5" />}
                    <span className="text-gray-500">{inv.invoice_date?.split('T')[0]}</span>
                    {inv.mileage && <span className="text-gray-400">{inv.mileage.toLocaleString()}km</span>}
                    <span className="font-medium">WO# {inv.workorder_number}</span>
                    <span className="ml-auto font-medium">${inv.grand_total?.toFixed(0)}</span>
                    {deferred.length > 0 && <span className="text-amber-500 ml-1">⚠️</span>}
                  </div>
                  
                  {/* Expanded Content - Completed first, then Deferred */}
                  {isExpanded && hasContent && (
                    <div className="ml-3 pl-2 border-l border-gray-200 mt-1 mb-1 space-y-0.5">
                      {/* Completed packages */}
                      {completed.map((pkg, j) => (
                        <div key={`c${j}`} className="text-xs text-gray-600 truncate">
                          ✓ {pkg.title}
                        </div>
                      ))}
                      {/* Deferred packages */}
                      {deferred.map((pkg, j) => (
                        <div key={`d${j}`} className="text-xs text-amber-600 truncate">
                          ⚠️ {pkg.title} - ${pkg.total?.toFixed(0)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PANEL 3: HISTORY & SERVICES - FIXED
// ============================================

function Panel3HistoryServices({
  vehicleHistory,
  servicePackages,
  loading,
  onAddToQuote,
  disabled,
  woMode
}) {
  const [activeTab, setActiveTab] = useState('services');
  const [historySearch, setHistorySearch] = useState('');
  const [expandedInvoices, setExpandedInvoices] = useState({});
  const [collapsedCategories, setCollapsedCategories] = useState(() => {
    // Initialize with all categories collapsed except favorites
    return {};
  });

  // Group packages: favorites first, then by category
  const groupedPackages = useMemo(() => {
    const result = { favorites: [] };
    
    if (!servicePackages || !Array.isArray(servicePackages)) {
      return result;
    }
    
    servicePackages.forEach(pkg => {
      if (pkg.is_favorite) {
        result.favorites.push(pkg);
      }
      // Also add to category (favorites appear in both)
      const cat = pkg.category || 'other';
      if (!result[cat]) result[cat] = [];
      if (!pkg.is_favorite) {
        result[cat].push(pkg);
      }
    });
    
    return result;
  }, [servicePackages]);

  // Set initial collapsed state when packages load
  useEffect(() => {
    if (servicePackages && servicePackages.length > 0) {
      const initial = {};
      Object.keys(groupedPackages).forEach(cat => {
        // Favorites open, everything else collapsed
        initial[cat] = cat !== 'favorites';
      });
      setCollapsedCategories(initial);
    }
  }, [servicePackages?.length]); // Only trigger on length change

  // Filter history - SAFELY handle null/undefined with try-catch
  const filteredInvoices = useMemo(() => {
    try {
      const invoices = vehicleHistory?.invoices;
      if (!invoices || !Array.isArray(invoices)) return [];
      if (!historySearch || historySearch.trim() === '') return invoices;
      
      const term = historySearch.toLowerCase().trim();
      return invoices.filter(inv => {
        try {
          // Search WO number (could be string or number)
          const woNum = String(inv.workorder_number || '').toLowerCase();
          if (woNum.includes(term)) return true;
          
          // Search invoice date
          const invDate = String(inv.invoice_date || '').toLowerCase();
          if (invDate.includes(term)) return true;
          
          // Search completed packages
          if (inv.completed_packages && Array.isArray(inv.completed_packages)) {
            for (const p of inv.completed_packages) {
              if (p.title && String(p.title).toLowerCase().includes(term)) return true;
            }
          }
          
          // Search deferred packages
          if (inv.deferred_packages && Array.isArray(inv.deferred_packages)) {
            for (const p of inv.deferred_packages) {
              if (p.title && String(p.title).toLowerCase().includes(term)) return true;
            }
          }
          
          return false;
        } catch (e) {
          return false;
        }
      });
    } catch (e) {
      console.error('History filter error:', e);
      return [];
    }
  }, [vehicleHistory, historySearch]);

  if (disabled) {
    return (
      <div className="border-r border-gray-200 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <History size={32} className="mx-auto mb-2 opacity-30" />
          <p>{woMode ? 'Services from WO' : 'Select a vehicle first'}</p>
          {woMode && (
            <p className="text-xs mt-1">Skip to booking →</p>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border-r border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const toggleCategory = (cat) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleInvoice = (woNumber) => {
    setExpandedInvoices(prev => ({ ...prev, [woNumber]: !prev[woNumber] }));
  };

  return (
    <div className="border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
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
      </div>

      {/* SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="flex-1 overflow-y-auto">
          {/* Add Generic Service */}
          <GenericServiceAdder onAddToQuote={onAddToQuote} />

          {/* Grouped Packages - Favorites FIRST, then alphabetical */}
          <div className="p-2 space-y-1">
            {/* Render favorites first if they exist */}
            {groupedPackages.favorites && groupedPackages.favorites.length > 0 && (
              <div>
                <button
                  onClick={() => toggleCategory('favorites')}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium uppercase rounded bg-amber-100 text-amber-800"
                >
                  <span className="flex items-center gap-1">
                    <Star size={10} className="fill-amber-500" />
                    Favorites ({groupedPackages.favorites.length})
                  </span>
                  <ChevronDown size={12} className={`transition-transform ${collapsedCategories['favorites'] ? '-rotate-90' : ''}`} />
                </button>

                {!collapsedCategories['favorites'] && (
                  <div className="mt-1 space-y-0.5">
                    {groupedPackages.favorites.map(pkg => (
                      <button
                        key={pkg.id}
                        onClick={() => onAddToQuote({
                          title: pkg.name,
                          total: pkg.base_price || 0,
                          labor_hours: pkg.base_hours || 1,
                          source: 'package'
                        })}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-sm bg-white border border-gray-100 rounded hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="truncate flex-1 text-left">{pkg.name}</span>
                        <span className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0 ml-2">
                          <span>${pkg.base_price?.toFixed(0)}</span>
                          <span>{pkg.base_hours}h</span>
                          <Plus size={12} className="text-blue-500" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Then render other categories */}
            {Object.entries(groupedPackages)
              .filter(([category]) => category !== 'favorites')
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, pkgs]) => {
                if (!pkgs || pkgs.length === 0) return null;
                const isCollapsed = collapsedCategories[category];

                return (
                  <div key={category}>
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium uppercase rounded bg-gray-100 text-gray-600"
                    >
                      <span>{category} ({pkgs.length})</span>
                      <ChevronDown size={12} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                    </button>

                    {!isCollapsed && (
                      <div className="mt-1 space-y-0.5">
                        {pkgs.map(pkg => (
                          <button
                            key={pkg.id}
                            onClick={() => onAddToQuote({
                              title: pkg.name,
                              total: pkg.base_price || 0,
                              labor_hours: pkg.base_hours || 1,
                              source: 'package'
                            })}
                            className="w-full flex items-center justify-between px-2 py-1.5 text-sm bg-white border border-gray-100 rounded hover:border-blue-300 hover:bg-blue-50"
                          >
                            <span className="truncate flex-1 text-left">{pkg.name}</span>
                            <span className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0 ml-2">
                              <span>${pkg.base_price?.toFixed(0)}</span>
                              <span>{pkg.base_hours}h</span>
                              <Plus size={12} className="text-blue-500" />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <>
          {/* Search */}
          <div className="p-2 border-b border-gray-200 flex-shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Stats */}
          {vehicleHistory?.stats && (
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <div className="flex gap-3 text-xs text-gray-600">
                <span><strong>{vehicleHistory.stats.total_invoices}</strong> visits</span>
                <span><strong>${vehicleHistory.stats.total_spent?.toLocaleString()}</strong> total</span>
              </div>
            </div>
          )}

          {/* Invoice List */}
          <div className="flex-1 overflow-y-auto">
            {filteredInvoices.map((invoice) => (
              <HistoryInvoiceCard
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
    </div>
  );
}

// Generic Service Adder
function GenericServiceAdder({ onAddToQuote }) {
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');

  const handleAdd = () => {
    const h = parseFloat(hours) || 0;
    if (h <= 0) return;
    
    onAddToQuote({
      title: note || 'Generic Service',
      total: h * LABOR_RATE,
      labor_hours: h,
      labor_total: h * LABOR_RATE,
      source: 'generic'
    });
    setHours('');
    setNote('');
  };

  return (
    <div className="p-2 border-b border-gray-200 bg-gray-50">
      <div className="flex gap-2">
        <input
          type="number"
          step="0.5"
          min="0"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Hrs"
          className="w-14 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Description..."
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={!hours || parseFloat(hours) <= 0}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
      {hours && parseFloat(hours) > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          = ${(parseFloat(hours) * LABOR_RATE).toFixed(0)} @ ${LABOR_RATE}/hr
        </div>
      )}
    </div>
  );
}

// History Invoice Card - WITH TRUNCATION
function HistoryInvoiceCard({ invoice, expanded, onToggle, onAddToQuote }) {
  const hasDeferred = invoice.deferred_packages?.filter(p => !p.is_header).length > 0;

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
      >
        <ChevronRight 
          size={12} 
          className={`text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} 
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">WO# {invoice.workorder_number}</span>
            <span className="text-sm font-medium">${invoice.grand_total?.toFixed(0)}</span>
          </div>
          <div className="text-xs text-gray-500 flex gap-2">
            <span>{invoice.invoice_date}</span>
            {invoice.mileage && <span>{invoice.mileage.toLocaleString()} km</span>}
            {hasDeferred && <span className="text-amber-600">⚠️ Deferred</span>}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-2 ml-5 space-y-1">
          {/* Completed - TRUNCATED */}
          {invoice.completed_packages?.map((pkg, i) => (
            <div key={i} className="flex items-center justify-between py-1 text-sm hover:bg-gray-50 rounded px-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Check size={12} className="text-green-500 flex-shrink-0" />
                <span className="truncate">{pkg.title}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs text-gray-500">{pkg.labor_hours || 1}h</span>
                <span className="text-gray-600">${pkg.total?.toFixed(0)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToQuote({
                      ...pkg,
                      source: 'history_completed',
                      source_wo: invoice.workorder_number
                    });
                  }}
                  className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {/* Deferred - TRUNCATED */}
          {invoice.deferred_packages?.filter(p => !p.is_header).map((pkg, i) => (
            <div key={i} className="flex items-center justify-between py-1 text-sm bg-amber-50 rounded px-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                <span className="truncate text-amber-800">{pkg.title}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs text-amber-600">{pkg.labor_hours || 1}h</span>
                <span className="text-amber-700">${pkg.total?.toFixed(0)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToQuote({
                      ...pkg,
                      source: 'history_deferred',
                      source_wo: invoice.workorder_number
                    });
                  }}
                  className="px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded text-xs hover:bg-amber-300"
                >
                  +
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
// PANEL 4: QUOTE & BOOKING - UNCHANGED
// ============================================

function Panel4QuoteBooking({
  quoteItems,
  onRemoveItem,
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
  selectedWorkorder
}) {
  // WORKORDER MODE - Simplified booking form
  if (selectedWorkorder) {
    return (
      <div className="flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 bg-blue-100 border-b border-blue-200 flex-shrink-0">
          <span className="text-sm font-medium text-blue-800">Quick Book from WO</span>
        </div>

        {/* WO Summary */}
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="text-xl font-bold text-blue-800 mb-2">
            WO# {selectedWorkorder.workorder_number}
          </div>
          <div className="text-sm text-gray-700 mb-1">
            {selectedWorkorder.customer_name || selectedWorkorder.company_name}
          </div>
          {selectedWorkorder.vehicle_description && (
            <div className="text-sm text-gray-600 mb-2">
              {selectedWorkorder.vehicle_description}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">{selectedWorkorder.line_count || 0} service lines</span>
            {selectedWorkorder.package_total > 0 && (
              <span className="font-bold text-green-700">
                ${selectedWorkorder.package_total?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* Booking Form */}
        <div className="p-4 border-t border-gray-200 space-y-3 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                disabled={formData.is_on_hold}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
              <select
                value={formData.tech_id}
                onChange={(e) => setFormData({ ...formData, tech_id: e.target.value })}
                disabled={formData.is_on_hold}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">Select tech...</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Appointment notes..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
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
        <div className="p-3 border-t border-gray-200 flex gap-2 flex-shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Calendar size={16} />
                Book WO
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

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
      {/* Header */}
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex-shrink-0">
        <span className="text-sm font-medium text-gray-700">Quote & Booking</span>
      </div>

      {/* Quote Items */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-xs text-gray-500 mb-2">
          Services ({quoteItems.length}) — {totalHours.toFixed(1)}h
        </div>

        {quoteItems.length === 0 ? (
          <div className="text-center text-gray-400 py-6">
            <Package size={20} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No services added</p>
            <p className="text-xs">Select from Services or History</p>
          </div>
        ) : (
          <div className="space-y-1">
            {quoteItems.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.title}</div>
                  <div className="text-xs text-gray-500">
                    {item.hours}h · ${item.total?.toFixed(0)}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals - Compact Single Line */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Sub: ${subtotal.toFixed(0)}</span>
          <span>+Sup: ${shopSupplies.toFixed(0)}</span>
          <span>+GST: ${gst.toFixed(0)}</span>
          <span>+Buf: ${buffer.toFixed(0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Estimate</span>
          <span className="text-lg font-bold text-green-600">${estimatedTotal.toFixed(0)}</span>
        </div>
      </div>

      {/* Booking Form */}
      <div className="p-3 border-t border-gray-200 space-y-2 flex-shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-0.5">Date</label>
            <input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              disabled={formData.is_on_hold}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-0.5">Technician</label>
            <select
              value={formData.tech_id}
              onChange={(e) => setFormData({ ...formData, tech_id: e.target.value })}
              disabled={formData.is_on_hold}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
            >
              <option value="">Select tech...</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-0.5">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Appointment notes..."
            rows={2}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm resize-none"
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
      <div className="p-3 border-t border-gray-200 flex gap-2 flex-shrink-0">
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 text-sm flex items-center justify-center gap-1"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Calendar size={14} />
              Book
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default BookingModal;
