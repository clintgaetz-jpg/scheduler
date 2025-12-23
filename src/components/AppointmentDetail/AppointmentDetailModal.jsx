import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Save, Trash2, Car, Pause, Scissors, CheckCircle, RotateCcw, GitBranch } from 'lucide-react';

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
import CardManagementModal from './modals/CardManagementModal';
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
  onQuickUpdate,
  onSplit,
  onOpenQuoteBuilder,
  onCollapseChild, // Handler for collapsing child cards back to parent
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
  const [showCardManagement, setShowCardManagement] = useState(false);
  const [relatedAppointments, setRelatedAppointments] = useState([]);

  // ─────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────
  
  // Reset state when appointment changes
  useEffect(() => {
    if (appointment) {
      setEditedAppointment({ 
        ...appointment,
        protractor_lines: Array.isArray(appointment.protractor_lines) ? appointment.protractor_lines : [],
        services: Array.isArray(appointment.services) ? appointment.services : []
      });
      setIsDirty(false);
    } else {
      setEditedAppointment(null);
    }
  }, [appointment]);

  // Load related appointments (children and parent)
  useEffect(() => {
    if (!isOpen || !editedAppointment?.id) {
      setRelatedAppointments([]);
      return;
    }

    const loadRelated = async () => {
      try {
        const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

        // Query for children (where parent_id = this appointment id)
        const childrenUrl = `appointments?parent_id=eq.${editedAppointment.id}&select=*&order=split_letter`;
        const childrenRes = await fetch(`${SUPABASE_URL}/rest/v1/${childrenUrl}`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        const children = childrenRes.ok ? await childrenRes.json() : [];

        // If this is a child, get parent and siblings
        let parent = null;
        let siblings = [];
        if (editedAppointment.parent_id) {
          const parentUrl = `appointments?id=eq.${editedAppointment.parent_id}&select=*`;
          const parentRes = await fetch(`${SUPABASE_URL}/rest/v1/${parentUrl}`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          const parentData = parentRes.ok ? await parentRes.json() : [];
          parent = parentData[0] || null;

          // Get siblings (other children of same parent)
          const siblingsUrl = `appointments?parent_id=eq.${editedAppointment.parent_id}&select=*&order=split_letter`;
          const siblingsRes = await fetch(`${SUPABASE_URL}/rest/v1/${siblingsUrl}`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          siblings = siblingsRes.ok ? await siblingsRes.json() : [];
        }

        // Combine all related appointments, including current appointment
        const related = [];
        if (parent) related.push(parent);
        related.push(...children);
        related.push(...siblings);
        
        // Make sure current appointment is included
        const currentInList = related.some(a => a && a.id === editedAppointment.id);
        if (!currentInList) {
          related.push(editedAppointment);
        }

        setRelatedAppointments(related);
      } catch (err) {
        console.error('Failed to load related appointments:', err);
        setRelatedAppointments([]);
      }
    };

    loadRelated();
  }, [isOpen, editedAppointment?.id, editedAppointment?.parent_id]);

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
    
    // Auto-save preference fields immediately
    if (field === 'prefer_wo_lines' && onQuickUpdate && editedAppointment?.id) {
      console.log('Saving prefer_wo_lines preference:', value, 'for appointment:', editedAppointment.id);
      onQuickUpdate(editedAppointment.id, { [field]: value }).catch(err => {
        console.error('Failed to save preference:', err);
      });
    }
  }, [editedAppointment?.id, onQuickUpdate]);

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

  // Handle workorder line updates (for tech assignment, etc.)
  const updateWOLine = useCallback((index, updates) => {
    setEditedAppointment(prev => {
      const protractorLines = [...(prev.protractor_lines || [])];
      protractorLines[index] = { ...protractorLines[index], ...updates };
      return { ...prev, protractor_lines: protractorLines };
    });
    setIsDirty(true);
  }, []);

  // Handle split - create child appointment and remove lines from parent
  const handleSplit = useCallback(async (appointmentParam, splitData) => {
    // Use editedAppointment for current state (includes WO number, etc.)
    const currentAppointment = editedAppointment || appointmentParam;
    if (!currentAppointment?.id) return;
    
    
    // NEW: Table-based split when lineIds present
    if (splitData.lineIds?.length > 0) {
      console.log('[Split] Table-based with lineIds:', splitData.lineIds);
      if (onSplit) await onSplit(currentAppointment, splitData);
      return;
    }
    try {
      // Get the split lines
      const splitLines = splitData.splitLines || [];
      const selectedIndices = splitData.lineIndices || [];
      const isWOLines = splitData.isWOLines || false;
      
      // DEBUG: Log the incoming data
      console.log('=== handleSplit DEBUG ===');
      console.log('isWOLines:', isWOLines);
      console.log('selectedIndices:', selectedIndices);
      console.log('splitLines count:', splitLines.length);
      console.log('splitLines titles:', splitLines.map(l => l.package_title || l.title));
      console.log('currentAppointment.protractor_lines count:', currentAppointment.protractor_lines?.length || 0);
      console.log('currentAppointment.services count:', currentAppointment.services?.length || 0);
      
      // ═══════════════════════════════════════════════════════════════════
      // CRITICAL FIX: Calculate the updated parent lines SYNCHRONOUSLY
      // Don't rely on async setState - compute the new arrays directly
      // ═══════════════════════════════════════════════════════════════════
      
      let updatedParentLines;
      if (isWOLines) {
        // Remove selected lines from protractor_lines
        const protractorLines = [...(currentAppointment.protractor_lines || [])];
        console.log('Before removal - protractorLines count:', protractorLines.length);
        const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
        console.log('Sorted indices to remove:', sortedIndices);
        sortedIndices.forEach(idx => {
          console.log('Removing index:', idx, '- title:', protractorLines[idx]?.package_title);
          protractorLines.splice(idx, 1);
        });
        console.log('After removal - protractorLines count:', protractorLines.length);
        updatedParentLines = { protractor_lines: protractorLines };
      } else {
        // Remove selected lines from services
        const services = [...(currentAppointment.services || [])];
        const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
        sortedIndices.forEach(idx => {
          services.splice(idx, 1);
        });
        updatedParentLines = { services };
      }
      
      // Create the updated parent appointment object (with lines removed)
      const updatedParentAppointment = {
        ...currentAppointment,
        ...updatedParentLines
      };
      
      console.log('updatedParentAppointment.protractor_lines count:', updatedParentAppointment.protractor_lines?.length || 0);
      
      // Update local state to reflect the change
      setEditedAppointment(updatedParentAppointment);
      
      // Determine split letter (A, B, C, etc.)
      const parentId = currentAppointment.parent_id || currentAppointment.id;
      const existingChildren = relatedAppointments.filter(a => a && a.parent_id === parentId).length;
      const splitLetter = String.fromCharCode(65 + existingChildren); // A, B, C, etc.
      
      // Calculate totals for child appointment
      const childHours = splitData.totals?.hours || splitLines.reduce((sum, line) => {
        if (isWOLines) {
          return sum + parseFloat(line.labor?.tech_hours || line.hours || 0);
        }
        return sum + parseFloat(line.hours || 0);
      }, 0);
      const childTotal = splitData.totals?.total || splitLines.reduce((sum, line) => {
        if (isWOLines) {
          return sum + parseFloat(line.package_total || line.total || 0);
        }
        return sum + parseFloat(line.total || line.estimated_total || 0);
      }, 0);
      
      // Determine child appointment assignment
      let childTechId = null;
      let childDate = null;
      let childIsOnHold = false;
      let childHoldReason = null;
      let childStatus = 'scheduled';
      
      if (splitData.splitType === 'tech') {
        childTechId = splitData.splitTech || null;
        childDate = currentAppointment.scheduled_date;
      } else if (splitData.splitType === 'date') {
        childTechId = currentAppointment.tech_id;
        childDate = splitData.splitDate || null;
      } else if (splitData.splitType === 'both') {
        childTechId = splitData.splitTech || null;
        childDate = splitData.splitDate || null;
      } else if (splitData.splitType === 'hold') {
        childIsOnHold = true;
        childHoldReason = splitData.holdReason || 'parts';
        childStatus = 'scheduled';
      }
      
      // Create child appointment data (with ONLY the split lines)
      const childAppointmentData = {
        parent_id: parentId,
        split_letter: splitLetter,
        
        // Copy customer/vehicle info
        customer_id: currentAppointment.customer_id,
        customer_name: currentAppointment.customer_name,
        customer_phone: currentAppointment.customer_phone,
        customer_phone_secondary: currentAppointment.customer_phone_secondary,
        customer_email: currentAppointment.customer_email,
        customer_address: currentAppointment.customer_address,
        company_name: currentAppointment.company_name,
        protractor_contact_id: currentAppointment.protractor_contact_id,
        
        vehicle_id: currentAppointment.vehicle_id,
        vehicle_vin: currentAppointment.vehicle_vin,
        vehicle_plate: currentAppointment.vehicle_plate,
        vehicle_mileage: currentAppointment.vehicle_mileage,
        unit_number: currentAppointment.unit_number,
        vehicle_make: currentAppointment.vehicle_make,
        vehicle_model: currentAppointment.vehicle_model,
        vehicle_submodel: currentAppointment.vehicle_submodel,
        vehicle_engine: currentAppointment.vehicle_engine,
        vehicle_color: currentAppointment.vehicle_color,
        vehicle_description: currentAppointment.vehicle_description,
        
        // Assignment
        scheduled_date: childDate,
        tech_id: childTechId,
        time_slot: currentAppointment.time_slot || 'anytime',
        estimated_hours: childHours,
        
        // Hold status
        is_on_hold: childIsOnHold,
        hold_reason: childHoldReason,
        hold_at: childIsOnHold ? new Date().toISOString() : null,
        
        // Status
        status: childStatus,
        
        // ONLY the split lines go to the child
        ...(isWOLines ? { protractor_lines: splitLines, services: [] } : { services: splitLines, protractor_lines: [] }),
        estimated_total: childTotal,
        
        // Work Order - same as parent
        workorder_number: currentAppointment.workorder_number || null,
        prefer_wo_lines: currentAppointment.prefer_wo_lines || false,
        
        // Notes
        notes: `Split from appointment #${currentAppointment.id}`,
        source: 'split',
        booking_group_id: currentAppointment.booking_group_id,
      };
      
      // ═══════════════════════════════════════════════════════════════════
      // Pass the UPDATED parent (with lines removed) to onSplit
      // ═══════════════════════════════════════════════════════════════════
      if (onSplit) {
        await onSplit(updatedParentAppointment, childAppointmentData);
      }
      
      setIsDirty(true);
    } catch (err) {
      console.error('Failed to create split:', err);
      alert('Failed to create split appointment. Please try again.');
    }
  }, [onSplit, editedAppointment, relatedAppointments]);

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
  // COMPUTED (ALL HOOKS MUST BE BEFORE EARLY RETURN)
  // ─────────────────────────────────────────────

  // Check if has children (must be before early return - hooks rule)
  const hasChildren = useMemo(() => {
    if (!editedAppointment?.id || !Array.isArray(relatedAppointments)) return false;
    return relatedAppointments.some(a => a && a.parent_id === editedAppointment.id);
  }, [relatedAppointments, editedAppointment?.id]);

  // Calculate completion status from Protractor lines (must be before early return - hooks rule)
  const allProtractorLinesDone = useMemo(() => {
    if (!editedAppointment?.protractor_lines || !Array.isArray(editedAppointment.protractor_lines) || editedAppointment.protractor_lines.length === 0) return false;
    return editedAppointment.protractor_lines.every(line => line?.labor?.completed === true);
  }, [editedAppointment?.protractor_lines]);

  // Calculate completion from appointment lines (must be before early return - hooks rule)
  const allAppointmentLinesDone = useMemo(() => {
    if (!editedAppointment?.services || !Array.isArray(editedAppointment.services) || editedAppointment.services.length === 0) return false;
    return editedAppointment.services.every(s => s?.status === 'done');
  }, [editedAppointment?.services]);

  // Combined completion status
  const allLinesDone = allProtractorLinesDone || allAppointmentLinesDone || editedAppointment?.all_lines_done;

  // Early return if no appointment (AFTER all hooks)
  if (!isOpen || !editedAppointment) return null;

  const tech = editedAppointment ? technicians.find(t => t.id === editedAppointment.tech_id) : null;
  
  // Calculate totals from services
  const totals = (editedAppointment?.services || []).reduce((acc, s) => {
    acc.hours += parseFloat(s?.hours) || 0;
    acc.total += parseFloat(s?.total) || 0;
    acc.doneCount += s?.status === 'done' ? 1 : 0;
    acc.holdCount += s?.status === 'hold' ? 1 : 0;
    return acc;
  }, { hours: 0, total: 0, doneCount: 0, holdCount: 0 });

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl flex flex-col w-[95vw] h-[95vh] overflow-hidden">
        
        {/* ═══════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════ */}
        <Header
          appointment={editedAppointment}
          tech={tech}
          technicians={technicians}
          isDirty={isDirty}
          hasChildren={hasChildren}
          relatedAppointments={relatedAppointments}
          onClose={handleClose}
          onUpdate={updateField}
          onStatusChange={onStatusChange}
        />

        {/* ═══════════════════════════════════════════
            MAIN CONTENT - Split Panels
        ═══════════════════════════════════════════ */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ─────────────────────────────────────────
              LEFT SIDEBAR - Only show for parent cards
          ───────────────────────────────────────── */}
          {!editedAppointment?.parent_id && (
            <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
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
          )}
          
          {/* Child Card: Simple info sidebar */}
          {editedAppointment?.parent_id && (
            <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Work Order</div>
                  <div className="text-lg font-bold text-gray-900">
                    {editedAppointment.workorder_number ? `#${editedAppointment.workorder_number}` : 'No W/O'}
                  </div>
                </div>
                <hr className="border-gray-200" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer</div>
                  <div className="text-sm font-semibold text-gray-900">{editedAppointment.customer_name}</div>
                  {editedAppointment.customer_phone && (
                    <div className="text-xs text-gray-600 mt-1">{editedAppointment.customer_phone}</div>
                  )}
                </div>
                <hr className="border-gray-200" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vehicle</div>
                  <div className="text-sm text-gray-900">
                    {editedAppointment.vehicle_description || 
                     `${editedAppointment.vehicle_year || ''} ${editedAppointment.vehicle_make || ''} ${editedAppointment.vehicle_model || ''}`.trim() ||
                     'No vehicle'}
                  </div>
                </div>
                <hr className="border-gray-200" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Assigned To</div>
                  <div className="text-sm text-gray-900">
                    {technicians.find(t => t.id === editedAppointment.tech_id)?.name || 'Unassigned'}
                  </div>
                  {editedAppointment.scheduled_date && (
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(editedAppointment.scheduled_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}

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
                onUpdateWOLine={updateWOLine}
                onAddService={onOpenQuoteBuilder}
                onPreferenceChange={updateField}
                relatedAppointments={relatedAppointments}
                onManageCards={() => setShowCardManagement(true)}
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

            {/* Card Management Button - Show if has children or is a child */}
            {(hasChildren || editedAppointment.parent_id) && (
              <button
                onClick={() => setShowCardManagement(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                <GitBranch size={18} />
                Manage Cards
              </button>
            )}
            
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
              disabled={editedAppointment?.status === 'completed' || allLinesDone}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${editedAppointment?.status === 'completed' || allLinesDone
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                }
              `}
            >
              <CheckCircle size={18} />
              {editedAppointment?.status === 'completed' || allLinesDone ? 'Completed ✓' : 'Mark Complete'}
            </button>
            {/* Completion Status Indicator */}
            {allLinesDone && editedAppointment?.status !== 'completed' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                All Lines Complete
              </span>
            )}
            
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
          useWOLines={editedAppointment?.prefer_wo_lines === true}
          onClose={() => setShowSplitModal(false)}
          onSplit={handleSplit}
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

      {/* Card Management Modal */}
      {showCardManagement && (
        <CardManagementModal
          appointment={editedAppointment}
          relatedAppointments={relatedAppointments}
          technicians={technicians}
          useWOLines={editedAppointment?.prefer_wo_lines === true}
          onClose={() => setShowCardManagement(false)}
          onOpenCard={(card) => {
            // TODO: Open the selected card - would need to reload appointment
            setShowCardManagement(false);
          }}
          onDeleteCard={async (cardId) => {
            // Collapse child card: merge lines back to parent
            try {
              const childCard = relatedAppointments.find(a => a.id === cardId);
              if (!childCard) return;
              
              const parentCard = editedAppointment.parent_id 
                ? relatedAppointments.find(a => a.id === editedAppointment.parent_id) || editedAppointment
                : editedAppointment;
              
              // Get lines from child card
              const childLines = editedAppointment?.prefer_wo_lines === true
                ? (childCard.protractor_lines || [])
                : (childCard.services || []);
              
              // Merge lines back to parent
              if (editedAppointment?.prefer_wo_lines === true) {
                setEditedAppointment(prev => ({
                  ...prev,
                  protractor_lines: [...(prev.protractor_lines || []), ...childLines]
                }));
              } else {
                setEditedAppointment(prev => ({
                  ...prev,
                  services: [...(prev.services || []), ...childLines]
                }));
              }
              
              // Delete the child card (actually delete from database, not soft delete)
              // We need to call a collapse handler, not the regular delete
              if (onCollapseChild) {
                await onCollapseChild(cardId, childLines, editedAppointment?.prefer_wo_lines === true);
              } else if (onDelete) {
                // Fallback: use regular delete but with different message
                await onDelete(cardId);
              }
              
              setIsDirty(true);
              setShowCardManagement(false);
            } catch (err) {
              console.error('Failed to collapse card:', err);
              alert('Failed to collapse card. Please try again.');
            }
          }}
          onRefresh={async () => {
            // Reload related appointments
            // TODO: Implement query for related appointments
          }}
        />
      )}

    </div>
  );
}
