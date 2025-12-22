import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, ChevronRight, Plus, Car, AlertTriangle, Pause } from 'lucide-react';

import { useCustomerLookup } from '../../hooks/useCustomerLookup';
import { useQuote } from '../../hooks/useQuote';
import { CustomerSearch } from '../customer/CustomerSearch';
import { CustomerCard } from '../customer/CustomerCard';
import { CustomerPanel } from '../customer/CustomerPanel';
import { QuoteBuilder } from './QuoteBuilder';
import { ServiceSettings } from './ServiceSettings';
import { detectCategory, CATEGORIES } from '../../utils/constants';
import { bookAppointment, findNextAvailable, updateAppointment } from '../../utils/supabase';

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Check if date is a weekend
const isWeekend = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

// Get next valid weekday
const getNextWeekday = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2); // Saturday -> Monday
  if (day === 0) d.setDate(d.getDate() + 1); // Sunday -> Monday
  return d.toISOString().split('T')[0];
};

// Get today or next weekday
const getInitialDate = (selectedDate) => {
  const date = selectedDate || new Date().toISOString().split('T')[0];
  return isWeekend(date) ? getNextWeekday(date) : date;
};

// ============================================
// BookingModal Component
// Full booking flow: customer -> vehicle -> quote -> schedule
// ============================================

export function BookingModal({
  isOpen,
  onClose,
  onSave,
  editingAppointment = null,
  technicians = [],
  servicePackages = [],
  serviceCategories = [],
  onRefreshServices,
  settings = {},
  selectedDate
}) {
  // Customer lookup hook
  const {
    searchTerm,
    searchResults,
    searching,
    customer,
    loading: customerLoading,
    search,
    selectCustomer,
    clearCustomer
  } = useCustomerLookup();

  // Quote hook
  const {
    services,
    totals,
    addService,
    removeService,
    clearServices
  } = useQuote(settings);

  // Local state
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [updateNeeded, setUpdateNeeded] = useState({});
  const [showServiceSettings, setShowServiceSettings] = useState(false);
  const [formData, setFormData] = useState({
    scheduled_date: getInitialDate(selectedDate),
    time_slot: 'anytime',
    tech_id: null,
    notes: '',
    customer_request: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveToHold, setSaveToHold] = useState(false);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedVehicle(null);
      clearServices();
      setUpdateNeeded({});
      setSaveToHold(false);
      setFormData(f => ({
        ...f,
        scheduled_date: getInitialDate(selectedDate),
        time_slot: 'anytime',
        tech_id: null,
        notes: '',
        customer_request: ''
      }));
    }
  }, [isOpen, selectedDate]);

  // Handle date change - block weekends
  const handleDateChange = (newDate) => {
    if (isWeekend(newDate)) {
      alert('Cannot book on weekends. Selecting next available weekday.');
      setFormData(f => ({ ...f, scheduled_date: getNextWeekday(newDate) }));
    } else {
      setFormData(f => ({ ...f, scheduled_date: newDate }));
    }
  };

  // Handle customer update flags
  const handleUpdateNeeded = (field, needed, value) => {
    setUpdateNeeded(prev => ({
      ...prev,
      [field]: needed ? value : undefined
    }));
  };

  // Add service from history/deferred/package
  const handleAddService = (pkg, price, hours, source, woNumber) => {
    addService(pkg, price, hours, source, woNumber);
  };

  // Validation
  const canBook = () => {
    if (!customer) return false;
    if (saveToHold) return true; // Allow saving to hold without tech/date
    if (!formData.tech_id) return false;
    if (!formData.scheduled_date) return false;
    if (isWeekend(formData.scheduled_date)) return false;
    return true;
  };

  const getValidationMessage = () => {
    if (!customer) return 'Select a customer';
    if (saveToHold) return null;
    if (!formData.tech_id) return 'Select a technician or save to Hold';
    if (!formData.scheduled_date) return 'Select a date';
    if (isWeekend(formData.scheduled_date)) return 'Cannot book on weekends';
    return null;
  };

  // Save the appointment
  const handleSave = async () => {
    if (!canBook()) {
      alert(getValidationMessage());
      return;
    }

    setSaving(true);

    try {
      // Build notes including update flags
      let notes = formData.notes;
      const updates = Object.entries(updateNeeded).filter(([_, v]) => v);
      if (updates.length > 0) {
        notes += '\n\n⚠️ UPDATE NEEDED IN PROTRACTOR:\n';
        updates.forEach(([field, value]) => {
          if (typeof value === 'object') {
            // contact_updates object
            Object.entries(value).forEach(([k, v]) => {
              notes += `- ${k}: ${v}\n`;
            });
          } else {
            notes += `- ${field}: ${value}\n`;
          }
        });
      }

      // Detect primary service category
      const primaryCategory = services[0] ? detectCategory(services[0].name) : 'general';
      
      // Parse customer name into first/last
      const nameParts = (customer.file_as || '').split(',').map(s => s.trim());
      const lastName = nameParts[0] || '';
      const firstName = nameParts[1] || '';

      const apptData = {
        // Customer fields - CORE
        customer_id: customer.id,
        customer_name: customer.file_as,
        customer_phone: customer.primary_phone,
        customer_phone_secondary: customer.secondary_phone || null,
        customer_email: customer.email || null,
        company_name: customer.company_name || null,
        protractor_contact_id: customer.protractor_contact_id,
        
        // Customer fields - EXTENDED (NEW)
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_street: customer.street || null,
        customer_city: customer.city || null,
        customer_state: customer.state || null,
        customer_zip: customer.zip || null,
        customer_country: customer.country || 'Canada',
        customer_address: [customer.street, customer.city, customer.state, customer.zip].filter(Boolean).join(', ') || null,
        
        // Customer stats (if available from lookup)
        customer_since: customer.customer_since || null,
        customer_lifetime_visits: customer.lifetime_visits || null,
        customer_lifetime_spent: customer.lifetime_spent || null,
        customer_avg_visit_value: customer.avg_visit_value || null,
        customer_last_visit_date: customer.last_visit_date || null,
        customer_days_since_visit: customer.days_since_visit || null,
        customer_is_supplier: customer.is_supplier || false,
        
        // Vehicle fields - CORE
        vehicle_id: selectedVehicle?.id || null,
        vehicle_vin: selectedVehicle?.vin || null,
        vehicle_plate: selectedVehicle?.plate || null,
        vehicle_mileage: selectedVehicle?.last_mileage ? parseInt(selectedVehicle.last_mileage) : null,
        unit_number: selectedVehicle?.unit_number || null,
        
        // Vehicle fields - EXTENDED (from get_customer_booking_context)
        vehicle_year: selectedVehicle?.year ? String(selectedVehicle.year) : null,
        vehicle_make: selectedVehicle?.make || null,
        vehicle_model: selectedVehicle?.model || null,
        vehicle_submodel: selectedVehicle?.submodel || null,
        vehicle_engine: selectedVehicle?.engine || null,
        vehicle_color: selectedVehicle?.color || null,
        vehicle_description: selectedVehicle?.description || (selectedVehicle 
          ? `${selectedVehicle.year || ''} ${selectedVehicle.make || ''} ${selectedVehicle.model || ''}`.trim()
          : null),
        vehicle_production_date: selectedVehicle?.production_date || null,
        vehicle_notes: selectedVehicle?.notes || selectedVehicle?.vehicle_notes || null,
        
        // Vehicle service status (from context)
        vehicle_service_status: selectedVehicle?.service_status || null,
        vehicle_days_since_service: selectedVehicle?.days_since_service || null,
        vehicle_last_service_date: selectedVehicle?.last_service_date || null,
        vehicle_mileage_estimated: selectedVehicle?.estimated_current_mileage || null,
        vehicle_km_since_service: selectedVehicle?.km_since_service || null,
        vehicle_service_due_reason: selectedVehicle?.service_due_reason || null,
        
        // Change tracking
        is_new_customer: customer.isNew || false,
        is_new_vehicle: selectedVehicle?.isNew || false,
        protractor_updates: Object.keys(updateNeeded).length > 0 ? updateNeeded : {},
        
        // Scheduling - handle Hold differently
        scheduled_date: saveToHold ? null : formData.scheduled_date,
        time_slot: formData.time_slot,
        tech_id: saveToHold ? null : formData.tech_id,
        estimated_hours: totals.hours || 1,
        
        // Hold status
        is_on_hold: saveToHold,
        hold_reason: saveToHold ? 'scheduling' : null,
        hold_notes: saveToHold ? 'Saved without tech/date assignment' : null,
        hold_at: saveToHold ? new Date().toISOString() : null,
        status: saveToHold ? 'scheduled' : 'scheduled', // Could use 'request' for hold
        
        // Services
        service_category: primaryCategory,
        services: services,
        estimated_total: totals.total,
        
        // Notes
        notes: notes.trim(),
        customer_request: formData.customer_request,
        source: 'manual'
      };

      console.log('SAVE DEBUG - Full apptData:', apptData);

      let result;
      if (editingAppointment) {
        result = await updateAppointment(editingAppointment.id, apptData);
      } else {
        result = await bookAppointment(apptData);
      }

      console.log('Booking result:', result);

      if (onSave) onSave(result);
      onClose();
    } catch (err) {
      console.error('Failed to save appointment:', err);
      alert('Failed to save appointment: ' + err.message);
    }

    setSaving(false);
  };

  if (!isOpen) return null;

  const validationMessage = getValidationMessage();
  const showWeekendWarning = isWeekend(formData.scheduled_date);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {editingAppointment ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel: Customer & Vehicle */}
          <div className="flex-1 flex flex-col border-r border-gray-200 overflow-hidden">
            {/* Top Section: Customer (left) + Vehicle (right) - fixed */}
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Customer - Left */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Customer</label>
                  {!customer ? (
                    <CustomerSearch
                      value={searchTerm}
                      onChange={search}
                      results={searchResults}
                      onSelect={selectCustomer}
                      searching={searching}
                    />
                  ) : (
                    <CustomerCard
                      customer={customer}
                      onClear={() => {
                        clearCustomer();
                        setSelectedVehicle(null);
                        clearServices();
                      }}
                      showUpdateFlags={true}
                      onUpdateNeeded={handleUpdateNeeded}
                      compact={true}
                    />
                  )}
                </div>

                {/* Vehicle - Right */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vehicle</label>
                  {!customer ? (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-400">
                      Select customer first
                    </div>
                  ) : selectedVehicle?.isNew ? (
                    /* New Vehicle Form */
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-300">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <input
                          type="text"
                          value={selectedVehicle.year || ''}
                          onChange={(e) => setSelectedVehicle({ ...selectedVehicle, year: e.target.value })}
                          placeholder="Year"
                          maxLength={4}
                          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          value={selectedVehicle.make || ''}
                          onChange={(e) => setSelectedVehicle({ ...selectedVehicle, make: e.target.value })}
                          placeholder="Make"
                          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          value={selectedVehicle.model || ''}
                          onChange={(e) => setSelectedVehicle({ ...selectedVehicle, model: e.target.value })}
                          placeholder="Model"
                          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={selectedVehicle.plate || ''}
                          onChange={(e) => setSelectedVehicle({ ...selectedVehicle, plate: e.target.value.toUpperCase() })}
                          placeholder="Plate"
                          className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                        />
                        <input
                          type="text"
                          value={selectedVehicle.vin || ''}
                          onChange={(e) => setSelectedVehicle({ ...selectedVehicle, vin: e.target.value.toUpperCase() })}
                          placeholder="VIN"
                          maxLength={17}
                          className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                        />
                      </div>
                      <button
                        onClick={() => setSelectedVehicle(null)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        ← Cancel
                      </button>
                    </div>
                  ) : selectedVehicle ? (
                    /* Selected Vehicle Display */
                    <div className="p-3 bg-green-50 rounded-lg border border-green-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                          </div>
                          {selectedVehicle.plate && (
                            <div className="text-sm text-gray-600 font-mono">{selectedVehicle.plate}</div>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedVehicle(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Vehicle Selection */
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {customer.vehicles?.length > 0 ? (
                        <div className="space-y-2">
                          {customer.vehicles.slice(0, 3).map((v, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedVehicle(v)}
                              className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm"
                            >
                              <span className="font-medium">{v.year} {v.make} {v.model}</span>
                              {v.plate && <span className="ml-2 text-gray-500 font-mono">{v.plate}</span>}
                            </button>
                          ))}
                          <button
                            onClick={() => setSelectedVehicle({ isNew: true })}
                            className="w-full text-left p-2 text-blue-600 hover:bg-blue-50 rounded text-sm flex items-center gap-1"
                          >
                            <Plus size={14} /> Add New Vehicle
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedVehicle({ isNew: true })}
                          className="w-full text-center p-2 text-blue-600 hover:bg-blue-50 rounded text-sm flex items-center justify-center gap-1"
                        >
                          <Plus size={14} /> Add Vehicle
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CustomerPanel with tabs - scrollable */}
            {customer && (
              <div className="flex-1 overflow-hidden">
                <CustomerPanel
                  customer={customer}
                  vehicles={customer.vehicles || []}
                  selectedVehicle={selectedVehicle}
                  onSelectVehicle={setSelectedVehicle}
                  onAddNewVehicle={() => setSelectedVehicle({ isNew: true })}
                  newVehicleData={selectedVehicle?.isNew ? selectedVehicle : null}
                  onNewVehicleChange={(data) => setSelectedVehicle({ ...selectedVehicle, ...data })}
                  servicePackages={servicePackages}
                  serviceCategories={serviceCategories}
                  onAddService={handleAddService}
                  addedServices={services}
                  loading={customerLoading}
                  onOpenSettings={() => setShowServiceSettings(true)}
                />
              </div>
            )}
          </div>

          {/* Right Panel: Quote + Scheduling */}
          <div className="w-96 flex flex-col">
            {/* Quote Builder - scrollable area */}
            <div className="flex-1 p-6 overflow-y-auto">
              <QuoteBuilder
                services={services}
                totals={totals}
                onRemove={removeService}
                showQuickAdd={false}
              />
            </div>

            {/* Scheduling - fixed at bottom */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <Calendar size={12} className="inline mr-1" /> Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${
                      showWeekendWarning ? 'border-red-300 bg-red-50' : ''
                    }`}
                  />
                  {showWeekendWarning && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle size={12} /> Cannot book on weekends
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      <Clock size={12} className="inline mr-1" /> Time Slot
                    </label>
                    <select
                      value={formData.time_slot}
                      onChange={(e) => setFormData(f => ({ ...f, time_slot: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="anytime">Anytime</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="waiter">Waiter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      <User size={12} className="inline mr-1" /> Technician
                    </label>
                    <select
                      value={formData.tech_id || ''}
                      onChange={(e) => setFormData(f => ({ ...f, tech_id: e.target.value || null }))}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${
                        !formData.tech_id && !saveToHold ? 'border-amber-300' : ''
                      }`}
                    >
                      <option value="">Select tech...</option>
                      {technicians.filter(t => t.is_active).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    rows={2}
                    placeholder="Internal notes..."
                  />
                </div>

                {/* Save to Hold toggle */}
                {!formData.tech_id && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <input
                      type="checkbox"
                      id="saveToHold"
                      checked={saveToHold}
                      onChange={(e) => setSaveToHold(e.target.checked)}
                      className="rounded border-amber-300"
                    />
                    <label htmlFor="saveToHold" className="text-sm text-amber-800 flex items-center gap-1">
                      <Pause size={14} /> Save to Hold (no tech/date required)
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center gap-3">
              {/* Validation message */}
              {validationMessage && !saveToHold && (
                <div className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {validationMessage}
                </div>
              )}
              {saveToHold && (
                <div className="text-sm text-amber-600 flex items-center gap-1">
                  <Pause size={14} />
                  Will save to Hold column
                </div>
              )}
              
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !canBook()}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    saveToHold 
                      ? 'bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {saving ? 'Saving...' : saveToHold ? (
                    <><Pause size={16} /> Save to Hold</>
                  ) : (
                    editingAppointment ? 'Update' : 'Book Appointment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Settings Modal */}
      <ServiceSettings
        isOpen={showServiceSettings}
        onClose={() => setShowServiceSettings(false)}
        onSave={() => {
          // Refresh services from parent
          if (onRefreshServices) onRefreshServices();
        }}
      />
    </div>
  );
}

export default BookingModal;
