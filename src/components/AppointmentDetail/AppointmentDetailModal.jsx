import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Trash2, Car, Pause, Scissors, CheckCircle, RotateCcw } from 'lucide-react';

// Sub-components
import Header from './Header';
import CustomerCard from './sidebar/CustomerCard';
import VehicleCard from './sidebar/VehicleCard';
import AssignmentCard from './sidebar/AssignmentCard';
import StatusChips from './sidebar/StatusChips';
import InvoicesPreview from './sidebar/InvoicesPreview';
import ServiceLines from './main/ServiceLines';
import NotesSection from './main/NotesSection';
import SplitModal from './modals/SplitModal';
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import HoldManagementModal from './modals/HoldManagementModal';
import PartsInvoicePanel from './PartsInvoicePanel';

// ============================================
// APPOINTMENT DETAIL MODAL
// The Control Center - Full screen job management
// ============================================

export default function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  technicians = [],
  servicePackages = [],
  onSave,
  onDelete,
  onStatusChange,
  onSplit,
  onOpenQuoteBuilder,
}) {
  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  const [editedAppointment, setEditedAppointment] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);

  // ─────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────
  
  // Reset state when appointment changes
  useEffect(() => {
    if (appointment) {
      setEditedAppointment({ ...appointment });
      setIsDirty(false);
    }
  }, [appointment]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        if (showSplitModal) {
          setShowSplitModal(false);
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          handleClose();
        }
      }
      
      // Ctrl+S to save
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (isDirty) handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, showSplitModal, showDeleteConfirm]);

  // ─────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────

  // Update a single field
  const updateField = useCallback((field, value) => {
    setEditedAppointment(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((updates) => {
    setEditedAppointment(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  // Update a service line
  const updateServiceLine = useCallback((index, updates) => {
    setEditedAppointment(prev => {
      const services = [...(prev.services || [])];
      services[index] = { ...services[index], ...updates };
      return { ...prev, services };
    });
    setIsDirty(true);
  }, []);

  // Handle save
  const handleSave = async () => {
    if (!editedAppointment || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave?.(editedAppointment);
      setIsDirty(false);
    } catch (err) {
      console.error('Save failed:', err);
      // TODO: Toast notification
    } finally {
      setIsSaving(false);
    }
  };

  // Handle close (check for unsaved changes)
  const handleClose = () => {
    if (isDirty) {
      // TODO: Could show "unsaved changes" warning
      // For now, just close
    }
    onClose();
  };

  // Handle status actions
  const handleMarkArrived = async () => {
    const updates = {
      vehicle_here: true,
      arrived_at: new Date().toISOString(),
    };
    updateFields(updates);
    await onStatusChange?.(editedAppointment.id, updates);
  };

  const handlePutOnHold = () => {
    setShowHoldModal(true);
  };

  const handleConfirmHold = (holdData) => {
    updateFields({
      ...holdData,
      status: 'hold',
    });
    setShowHoldModal(false);
  };

  const handleMarkComplete = async () => {
    const updates = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      all_lines_done: true,
    };
    updateFields(updates);
    await onStatusChange?.(editedAppointment.id, updates);
  };

  const handleDelete = async () => {
    const updates = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    };
    await onStatusChange?.(editedAppointment.id, updates);
    setShowDeleteConfirm(false);
    onClose();
  };

  // Reset to original
  const handleReset = () => {
    setEditedAppointment({ ...appointment });
    setIsDirty(false);
  };

  // ─────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────

  const tech = technicians.find(t => t.id === editedAppointment?.tech_id);
  
  // Calculate totals from services
  const totals = (editedAppointment?.services || []).reduce((acc, s) => {
    acc.hours += parseFloat(s.hours) || 0;
    acc.total += parseFloat(s.total) || 0;
    acc.doneCount += s.status === 'done' ? 1 : 0;
    acc.holdCount += s.status === 'hold' ? 1 : 0;
    return acc;
  }, { hours: 0, total: 0, doneCount: 0, holdCount: 0 });

  // Check if has children
  const hasChildren = false; // TODO: Query for children

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  if (!isOpen || !editedAppointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl flex flex-col w-[95vw] h-[90vh] max-w-[1400px] overflow-hidden">
        
        {/* ═══════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════ */}
        <Header
          appointment={editedAppointment}
          tech={tech}
          technicians={technicians}
          isDirty={isDirty}
          hasChildren={hasChildren}
          onClose={handleClose}
          onUpdate={updateField}
          onStatusChange={onStatusChange}
        />

        {/* ═══════════════════════════════════════════
            MAIN CONTENT - Split Panels
        ═══════════════════════════════════════════ */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ─────────────────────────────────────────
              LEFT SIDEBAR
          ───────────────────────────────────────── */}
          <aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4 space-y-4">
              
              {/* Customer Card */}
              <CustomerCard 
                appointment={editedAppointment}
                onUpdate={updateField}
              />
              
              <hr className="border-gray-200" />
              
              {/* Vehicle Card */}
              <VehicleCard 
                appointment={editedAppointment}
                onUpdate={updateField}
              />
              
              <hr className="border-gray-200" />
              
              {/* Assignment Card */}
              <AssignmentCard
                appointment={editedAppointment}
                technicians={technicians}
                onUpdate={updateField}
              />
              
              <hr className="border-gray-200" />
              
              {/* Status Chips */}
              <StatusChips 
                appointment={editedAppointment}
              />
              
              <hr className="border-gray-200" />
              
              {/* Invoices Preview */}
              <InvoicesPreview
                appointment={editedAppointment}
                onViewAll={() => {/* TODO: Open invoices panel */}}
              />
              
              <hr className="border-gray-200" />
              
              {/* Parts Invoices */}
              {editedAppointment.workorder_number && (
                <PartsInvoicePanel
                  appointment={editedAppointment}
                  onUpdate={updateField}
                />
              )}
              
            </div>
          </aside>

          {/* ─────────────────────────────────────────
              RIGHT MAIN PANEL
          ───────────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden">
            
            {/* Service Lines - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              <ServiceLines
                appointment={editedAppointment}
                servicePackages={servicePackages}
                technicians={technicians}
                onUpdateLine={updateServiceLine}
                onAddService={onOpenQuoteBuilder}
              />
            </div>
            
            {/* Notes Section - Fixed height at bottom */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <NotesSection
                appointment={editedAppointment}
                onUpdate={updateField}
              />
            </div>
            
          </main>
        </div>

        {/* ═══════════════════════════════════════════
            FOOTER - Actions
        ═══════════════════════════════════════════ */}
        <footer className="border-t border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          
          {/* Primary Actions (Left) */}
          <div className="flex items-center gap-2">
            
            {/* Arrived Button */}
            <button
              onClick={handleMarkArrived}
              disabled={editedAppointment.vehicle_here}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${editedAppointment.vehicle_here
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                }
              `}
            >
              <Car size={18} />
              {editedAppointment.vehicle_here ? 'Arrived ✓' : 'Mark Arrived'}
            </button>

            {/* Hold Button */}
            <button
              onClick={handlePutOnHold}
              disabled={editedAppointment.is_on_hold}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${editedAppointment.is_on_hold
                  ? 'bg-amber-100 text-amber-700 cursor-default'
                  : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-amber-700'
                }
              `}
            >
              <Pause size={18} />
              {editedAppointment.is_on_hold ? 'On Hold' : 'Put on Hold'}
            </button>

            {/* Split Button */}
            <button
              onClick={() => setShowSplitModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all"
            >
              <Scissors size={18} />
              Split Job
            </button>

            {/* Complete Button */}
            <button
              onClick={handleMarkComplete}
              disabled={editedAppointment.status === 'completed'}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${editedAppointment.status === 'completed'
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                }
              `}
            >
              <CheckCircle size={18} />
              {editedAppointment.status === 'completed' ? 'Completed ✓' : 'Mark Complete'}
            </button>
            
          </div>

          {/* Secondary Actions (Right) */}
          <div className="flex items-center gap-2">
            
            {/* Unsaved indicator */}
            {isDirty && (
              <span className="text-sm text-amber-600 mr-2">
                Unsaved changes
              </span>
            )}
            
            {/* Reset Button */}
            {isDirty && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-all"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            )}

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-all"
            >
              <Trash2 size={16} />
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className={`
                flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all
                ${isDirty
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            
          </div>
        </footer>

      </div>

      {/* ═══════════════════════════════════════════
          SUB-MODALS
      ═══════════════════════════════════════════ */}
      
      {/* Split Modal */}
      {showSplitModal && (
        <SplitModal
          appointment={editedAppointment}
          technicians={technicians}
          onClose={() => setShowSplitModal(false)}
          onSplit={onSplit}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Hold Management Modal */}
      {showHoldModal && (
        <HoldManagementModal
          appointment={editedAppointment}
          onClose={() => setShowHoldModal(false)}
          onConfirm={handleConfirmHold}
        />
      )}

    </div>
  );
}
