import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Save, Trash2, Phone, Mail, MapPin, Car, FileText, 
  ChevronDown, ChevronUp, Clock, Package, AlertCircle,
  CheckCircle, XCircle, RotateCcw, Calendar, User, Pause
} from 'lucide-react';

import { AppointmentStatusLEDs } from '../shared/LEDIndicator';
import CustomerPanel from './CustomerPanel';
import VehiclePanel from './VehiclePanel';
import ServicesPanel from './ServicesPanel';
import PartsPanel from './PartsPanel';
import NotesPanel from './NotesPanel';
import ActionButtons from './ActionButtons';
import ServiceLines from './main/ServiceLines';
import PartsInvoicePanel from './PartsInvoicePanel';

// ============================================
// APPOINTMENT DETAIL MODAL
// Main container - orchestrates all panels
// ============================================

export default function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  technicians,
  servicePackages,
  onSave,
  onDelete,
  onStatusChange,
  onRebook,
  onImportFromProtractor,
}) {
  // Local state for editing
  const [editedAppointment, setEditedAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('services'); // services, parts, notes, history
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAuthorizeModal, setShowAuthorizeModal] = useState(false);

  // Reset state when appointment changes
  useEffect(() => {
    if (appointment) {
      setEditedAppointment({ ...appointment });
      setIsDirty(false);
      setActiveTab('services');
    }
  }, [appointment]);

  // Handle field updates
  const updateField = useCallback((field, value) => {
    setEditedAppointment(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Handle service line updates (for hold status, etc.)
  const updateServiceLine = useCallback((index, updates) => {
    setEditedAppointment(prev => {
      const services = [...(prev.services || [])];
      services[index] = { ...services[index], ...updates };
      return { ...prev, services };
    });
    setIsDirty(true);
  }, []);

  // Handle workorder line updates (for tech assignment, etc.)
  const updateWOLine = useCallback((index, updates) => {
    setEditedAppointment(prev => {
      const protractorLines = [...(prev.protractor_lines || [])];
      protractorLines[index] = { ...protractorLines[index], ...updates };
      return { ...prev, protractor_lines: protractorLines };
    });
    setIsDirty(true);
  }, []);

  // Calculate time stats
  const getTimeStats = useCallback(() => {
    if (!editedAppointment?.services) {
      return { 
        totalHours: editedAppointment?.estimated_hours || 0, 
        completedHours: 0, 
        remainingHours: editedAppointment?.estimated_hours || 0 
      };
    }
    
    const services = editedAppointment.services;
    let totalHours = 0;
    let completedHours = 0;
    
    services.forEach(s => {
      const hours = parseFloat(s.hours) || 0;
      totalHours += hours;
      if (s.status === 'done') {
        completedHours += hours;
      }
    });
    
    return {
      totalHours,
      completedHours,
      remainingHours: totalHours - completedHours
    };
  }, [editedAppointment]);

  // Handle save
  const handleSave = async () => {
    if (onSave && editedAppointment) {
      await onSave(editedAppointment);
      setIsDirty(false);
    }
  };

  // Handle status action (arrived, no-show, cancelled, completed)
  const handleStatusAction = async (action) => {
    if (!editedAppointment) return;
    
    const updates = {};
    switch (action) {
      case 'arrived':
        updates.vehicle_here = !editedAppointment.vehicle_here;
        updates.arrived_at = !editedAppointment.vehicle_here ? new Date().toISOString() : null;
        break;
      case 'completed':
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
        break;
      case 'no_show':
        updates.status = 'no_show';
        updates.no_show_at = new Date().toISOString();
        break;
      case 'cancelled':
        updates.status = 'cancelled';
        updates.cancelled_at = new Date().toISOString();
        break;
    }
    
    // Update local state
    setEditedAppointment(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
    
    // Save to backend
    if (onStatusChange) {
      await onStatusChange(editedAppointment.id, updates);
    }
    
    // Only close for destructive actions
    if (action === 'cancelled' || action === 'no_show') {
      onClose();
    }
  };

  // Handle authorize button - prompt for WO#
  const handleAuthorize = () => {
    setShowAuthorizeModal(true);
  };

  if (!isOpen || !editedAppointment) return null;

  const timeStats = getTimeStats();
  const tech = technicians?.find(t => t.id === editedAppointment.tech_id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {editedAppointment.customer_name}
              </h2>
              {editedAppointment.is_on_hold && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  ON HOLD
                </span>
              )}
              {isDirty && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Unsaved
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-0.5">
              {editedAppointment.vehicle_description}
              {editedAppointment.vehicle_vin && (
                <span className="ml-2 text-gray-400 font-mono text-xs">
                  VIN: {editedAppointment.vehicle_vin}
                </span>
              )}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              {/* Tech Assignment Dropdown */}
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <select
                  value={editedAppointment.tech_id || ''}
                  onChange={(e) => updateField('tech_id', e.target.value || null)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium"
                  style={{ 
                    backgroundColor: tech?.color ? `${tech.color}15` : 'white',
                    color: tech?.color || '#374151'
                  }}
                >
                  <option value="">Unassigned</option>
                  {technicians?.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <span className="flex items-center gap-1 text-gray-500">
                <Calendar size={14} /> {editedAppointment.scheduled_date}
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <Clock size={14} /> 
                {timeStats.remainingHours < timeStats.totalHours ? (
                  <span>
                    <span className="text-green-600">{timeStats.completedHours}h done</span>
                    {' / '}
                    <span className="text-amber-600">{timeStats.remainingHours}h left</span>
                  </span>
                ) : (
                  <span>{timeStats.totalHours}h</span>
                )}
              </span>
            </div>
          </div>
          
          {/* Right: Actions + Close */}
          <div className="flex items-start gap-3">
            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Mark Arrived */}
              <button
                onClick={() => handleStatusAction('arrived')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  editedAppointment.vehicle_here
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                <Car size={14} />
                {editedAppointment.vehicle_here ? 'Arrived' : 'Arrived'}
              </button>

              {/* Put on Hold */}
              <button
                onClick={() => {
                  const updates = {
                    is_on_hold: !editedAppointment.is_on_hold,
                    hold_at: !editedAppointment.is_on_hold ? new Date().toISOString() : null
                  };
                  updateField('is_on_hold', updates.is_on_hold);
                  updateField('hold_at', updates.hold_at);
                  onStatusChange?.(editedAppointment.id, updates);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  editedAppointment.is_on_hold
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                }`}
              >
                <Pause size={14} />
                {editedAppointment.is_on_hold ? 'Hold' : 'Hold'}
              </button>

              {/* Mark Complete */}
              <button
                onClick={() => handleStatusAction('completed')}
                disabled={editedAppointment.status === 'completed'}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  editedAppointment.status === 'completed'
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                <CheckCircle size={14} />
                Complete
              </button>
            </div>
            
            <AppointmentStatusLEDs appointment={editedAppointment} />
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4">
          {[
            { id: 'services', label: 'Services', icon: FileText },
            { id: 'parts', label: 'Parts', icon: Package },
            { id: 'notes', label: 'Notes', icon: AlertCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 bg-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'}
              `}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Column - Customer & Vehicle Info */}
          <div className="w-72 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto flex-shrink-0">
            <CustomerPanel 
              appointment={editedAppointment}
              onUpdate={updateField}
            />
            <div className="border-t border-gray-200 my-4" />
            <VehiclePanel 
              appointment={editedAppointment}
              onUpdate={updateField}
            />
          </div>

          {/* Right Column - Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'services' && (
              <ServiceLines
                appointment={editedAppointment}
                servicePackages={servicePackages}
                technicians={technicians}
                onUpdateLine={updateServiceLine}
                onUpdateWOLine={updateWOLine}
                onAddService={() => {/* TODO: Open quote builder */}}
                onPreferenceChange={updateField}
              />
            )}
            {activeTab === 'parts' && (
              <div className="space-y-4">
                <PartsPanel
                  appointment={editedAppointment}
                  onUpdate={updateField}
                />
                {editedAppointment.workorder_number && (
                  <>
                    <div className="border-t border-gray-200 my-4" />
                    <PartsInvoicePanel
                      appointment={editedAppointment}
                      onUpdate={updateField}
                    />
                  </>
                )}
              </div>
            )}
            {activeTab === 'notes' && (
              <NotesPanel
                appointment={editedAppointment}
                onUpdate={updateField}
              />
            )}
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
          <ActionButtons
            appointment={editedAppointment}
            onArrived={() => handleStatusAction('arrived')}
            onNoShow={() => handleStatusAction('no_show')}
            onCancelled={() => handleStatusAction('cancelled')}
            onRebook={() => onRebook?.(editedAppointment)}
          />
          
          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={() => setEditedAppointment({ ...appointment })}
                className="px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                <RotateCcw size={16} className="inline mr-1" />
                Reset
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 size={16} className="inline mr-1" />
              Delete
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                ${isDirty 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Appointment?</h3>
            <p className="text-gray-600 mb-4">This will move the appointment to cancelled. You can restore it later.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleStatusAction('cancelled');
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authorize Modal */}
      {showAuthorizeModal && (
        <AuthorizeModal
          appointment={editedAppointment}
          onClose={() => setShowAuthorizeModal(false)}
          onAuthorize={(woNumber, importData) => {
            updateField('workorder_number', woNumber);
            updateField('authorized', true);
            if (importData && onImportFromProtractor) {
              onImportFromProtractor(woNumber);
            }
            setShowAuthorizeModal(false);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// AUTHORIZE MODAL - WO# Entry + Import Option
// ============================================
function AuthorizeModal({ appointment, onClose, onAuthorize }) {
  const [woNumber, setWoNumber] = useState(appointment.workorder_number || '');
  const [shouldImport, setShouldImport] = useState(true);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Authorize Work Order</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Order Number
            </label>
            <input
              type="text"
              value={woNumber}
              onChange={(e) => setWoNumber(e.target.value)}
              placeholder="e.g., 59141"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              autoFocus
            />
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shouldImport}
              onChange={(e) => setShouldImport(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Import line items from Protractor
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-6">
            Updates services with actual parts, labor hours, and totals
          </p>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onAuthorize(woNumber, shouldImport)}
            disabled={!woNumber.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Authorize
          </button>
        </div>
      </div>
    </div>
  );
}
