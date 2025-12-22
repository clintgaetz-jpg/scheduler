import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { useBookingState } from './hooks/useBookingState';
import { CustomerFleetPanel } from './panels/CustomerFleetPanel';
import { VehicleServicePanel } from './panels/VehicleServicePanel';
import { QuoteBookingPanel } from './panels/QuoteBookingPanel';

// ============================================
// BookingModal - 3-Panel Full Screen Layout
// 
// Left:   Customer info + Fleet overview
// Middle: Vehicle details + History + Service picker
// Right:  Quote builder + Booking controls
// ============================================

export function BookingModal({
  isOpen,
  onClose,
  onSave,
  editingAppointment = null,
  technicians = [],
  servicePackages = [],
  serviceCategories = [],
  holidays = [],
  settings = {},
  selectedDate
}) {
  // Centralized booking state
  const booking = useBookingState({
    editingAppointment,
    selectedDate,
    settings
  });

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      booking.reset(selectedDate);
    }
  }, [isOpen]);

  // Handle save
  const handleSave = async () => {
    const result = await booking.save();
    if (result.success) {
      onSave?.(result.data);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      {/* Nearly full-screen modal */}
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[92vh] max-w-[1800px] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingAppointment ? 'Edit Appointment' : 'New Appointment'}
            </h2>
            {booking.customer && (
              <span className="text-gray-500">
                — {booking.customer.file_as}
                {booking.selectedVehicle && !booking.selectedVehicle.isNew && (
                  <span className="text-gray-400">
                    {' · '}{booking.selectedVehicle.year} {booking.selectedVehicle.make} {booking.selectedVehicle.model}
                  </span>
                )}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 3-Panel Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANEL: Customer + Fleet */}
          <div className="w-[340px] flex-shrink-0 border-r border-gray-200 flex flex-col overflow-hidden bg-gray-50">
            <CustomerFleetPanel
              customer={booking.customer}
              vehicles={booking.vehicles}
              selectedVehicle={booking.selectedVehicle}
              onSelectCustomer={booking.selectCustomer}
              onClearCustomer={booking.clearCustomer}
              onSelectVehicle={booking.selectVehicle}
              onAddNewVehicle={booking.addNewVehicle}
              onUpdateVehicle={booking.updateNewVehicleData}
              loading={booking.customerLoading}
              vehicleSort={booking.vehicleSort}
              onChangeVehicleSort={booking.setVehicleSort}
            />
          </div>

          {/* MIDDLE PANEL: Vehicle + Services */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <VehicleServicePanel
              customer={booking.customer}
              selectedVehicle={booking.selectedVehicle}
              vehicleHistory={booking.vehicleHistory}
              vehicleHistoryLoading={booking.vehicleHistoryLoading}
              servicePackages={servicePackages}
              serviceCategories={serviceCategories}
              onAddService={booking.addService}
              onAddCustomLine={booking.addCustomLine}
              addedServiceIds={booking.services.map(s => s.id)}
              onLoadVehicleHistory={booking.loadVehicleHistory}
            />
          </div>

          {/* RIGHT PANEL: Quote + Booking */}
          <div className="w-[360px] flex-shrink-0 border-l border-gray-200 flex flex-col overflow-hidden">
            <QuoteBookingPanel
              services={booking.services}
              totals={booking.totals}
              onRemoveService={booking.removeService}
              onReorderServices={booking.reorderServices}
              scheduling={booking.scheduling}
              onUpdateScheduling={booking.updateScheduling}
              technicians={technicians}
              holidays={holidays}
              settings={settings}
              canBook={booking.canBook}
              validationMessage={booking.validationMessage}
              saving={booking.saving}
              onSave={handleSave}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
