import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, ChevronRight, Plus, Car } from 'lucide-react';

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
    scheduled_date: selectedDate || new Date().toISOString().split('T')[0],
    time_slot: 'anytime',
    tech_id: null,
    notes: '',
    customer_request: ''
  });
  const [saving, setSaving] = useState(false);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedVehicle(null);
      clearServices();
      setUpdateNeeded({});
      setFormData(f => ({
        ...f,
        scheduled_date: selectedDate || new Date().toISOString().split('T')[0],
        time_slot: 'anytime',
        tech_id: null,
        notes: '',
        customer_request: ''
      }));
    }
  }, [isOpen, selectedDate]);

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

  // Save the appointment
  const handleSave = async () => {
    if (!customer) {
      alert('Please select a customer');
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

      console.log('SAVE DEBUG - customer:', customer);
      console.log('SAVE DEBUG - selectedVehicle:', selectedVehicle);
      
      const apptData = {
        // Customer fields
        customer_id: customer.id,
        customer_name: customer.file_as,
        customer_phone: customer.primary_phone,
        customer_phone_secondary: customer.secondary_phone || null,
        customer_email: customer.email || null,
        customer_address: [customer.street, customer.city, customer.state].filter(Boolean).join(', ') || null,
        company_name: customer.company_name || null,
        protractor_contact_id: customer.protractor_contact_id,
        
        // Vehicle fields
        vehicle_id: selectedVehicle?.id || null,
        vehicle_description: selectedVehicle 
          ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
          : null,
        vehicle_vin: selectedVehicle?.vin || null,
        vehicle_plate: selectedVehicle?.plate || null,
        vehicle_mileage: selectedVehicle?.last_mileage ? parseInt(selectedVehicle.last_mileage) : null,
        unit_number: selectedVehicle?.unit_number || null,
        
        // Scheduling
        scheduled_date: formData.scheduled_date,
        time_slot: formData.time_slot,
        tech_id: formData.tech_id || null,
        estimated_hours: totals.hours || 1,
        
        // Services
        service_category: primaryCategory,
        services: services,
        estimated_total: totals.total,
        
        // Notes
        notes: notes.trim(),
        customer_request: formData.customer_request,
        source: 'manual'
      };

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
                    (() => {
                      const v = customer.vehicles?.find(veh => veh.vin === selectedVehicle.vin) || selectedVehicle;
                      const lastVisit = v.last_seen_at || v.history?.[0]?.invoice_date;
                      const days = lastVisit ? Math.floor((new Date() - new Date(lastVisit)) / (1000 * 60 * 60 * 24)) : null;
                      const isOverdue = days && days > 180;
                      const isWarning = days && days > 120 && days <= 180;
                      
                      return (
                        <div className={`p-3 rounded-lg border ${
                          isOverdue ? 'bg-red-50 border-red-300' : 
                          isWarning ? 'bg-amber-50 border-amber-300' : 
                          'bg-green-50 border-green-300'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Car size={16} className={isOverdue ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-green-600'} />
                              <span className="font-semibold text-gray-900">
                                {v.year} {v.make} {v.model}
                              </span>
                              {isOverdue && <span className="text-xs text-white bg-red-500 px-1.5 py-0.5 rounded font-medium">DUE</span>}
                              {isWarning && !isOverdue && <span className="text-xs text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded font-medium">SOON</span>}
                            </div>
                            <button
                              onClick={() => setSelectedVehicle(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                            {v.plate && <span className="font-mono">{v.plate}</span>}
                            {v.last_mileage && <span>{parseInt(v.last_mileage).toLocaleString()} km</span>}
                            {days !== null && (
                              <span className={isOverdue ? 'text-red-600 font-medium' : isWarning ? 'text-amber-600' : ''}>
                                {days}d ago
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* No Vehicle Selected */
                    <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                      <p className="text-sm text-gray-500 mb-2">Select from list below</p>
                      <button
                        onClick={() => setSelectedVehicle({ isNew: true, year: '', make: '', model: '', vin: '', plate: '' })}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Add New Vehicle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Panel with Tabs - scrollable */}
            {customer && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <CustomerPanel
                  customer={customer}
                  vehicles={customer.vehicles || []}
                  selectedVehicle={selectedVehicle}
                  onSelectVehicle={setSelectedVehicle}
                  onAddNewVehicle={setSelectedVehicle}
                  newVehicleData={selectedVehicle?.isNew ? selectedVehicle : null}
                  onNewVehicleChange={setSelectedVehicle}
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

          {/* Right Panel: Quote & Scheduling */}
          <div className="w-96 flex flex-col bg-gray-50">
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
                    onChange={(e) => setFormData(f => ({ ...f, scheduled_date: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
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
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Auto-assign</option>
                      {technicians.map(t => (
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
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !customer}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Booking...' : (editingAppointment ? 'Update' : 'Book Appointment')}
              </button>
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
