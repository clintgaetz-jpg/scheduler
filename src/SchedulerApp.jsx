import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, Plus, Calendar, Coffee, Settings, 
  FileText, DollarSign, Package, Clock, CheckCircle2, Bell, Trash2,
  UserPlus, X, AlertCircle, RefreshCw
} from 'lucide-react';

// Component imports
import { BookingModal } from './components/booking/BookingModal';
import { StatusColumn } from './components/scheduler/StatusColumn';
import { AppointmentListModal, AppointmentDetailModal } from './components/scheduler';
import { SettingsView } from './components/SettingsView';
import { AppointmentCard, CARD_STATUS_COLORS } from './components/scheduler/AppointmentCard';

// ============================================
// SUPABASE CONFIG
// ============================================
const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

const supabase = {
  async fetch(table, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const params = new URLSearchParams();
    
    if (options.select) params.append('select', options.select);
    if (options.order) params.append('order', options.order);
    if (options.limit) params.append('limit', options.limit);
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        params.append(key, value);
      });
    }
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    return res.json();
  },
  
  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  async update(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  // SOFT DELETE - sets status to 'deleted' instead of removing
  async softDelete(table, id) {
    return this.update(table, id, { 
      status: 'deleted', 
      deleted_at: new Date().toISOString() 
    });
  },
  
  async rpc(fn, params = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });
    return res.json();
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatMoney = (amount) => {
  if (!amount) return '$0.00';
  return '$' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Get weekdays only (Mon-Fri) - NO WEEKENDS
const getWeekDates = (date) => {
  // Handle both Date objects and date strings
  let d;
  if (date instanceof Date) {
    d = new Date(date);
  } else {
    d = new Date(date + 'T12:00:00');
  }
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  return Array.from({ length: 5 }, (_, i) => {
    const newDate = new Date(d);
    newDate.setDate(d.getDate() + i);
    // Format as YYYY-MM-DD without timezone conversion
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(newDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayOfMonth}`;
  });
};

// Check if date is a weekend
const isWeekend = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

// ============================================
// MAIN SCHEDULER APP
// ============================================
export default function SchedulerApp() {
  // View state
  const [activeView, setActiveView] = useState('scheduler');
  
  // Data from Supabase
  const [technicians, setTechnicians] = useState([]);
  const [servicePackages, setServicePackages] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [settings, setSettings] = useState({});
  
  // UI state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggedJob, setDraggedJob] = useState(null);
  
  // Dynamic tech visibility
  const [showOccasionalTechs, setShowOccasionalTechs] = useState({}); // { techId: true/false }
  
  // Modal states
  const [listModal, setListModal] = useState({ isOpen: false, title: '', filter: null });
  const [detailModal, setDetailModal] = useState({ isOpen: false, appointment: null });
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // ============================================
  // LOAD DATA
  // ============================================
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [techsData, packagesData, categoriesData, settingsData, apptsData] = await Promise.all([
        supabase.fetch('technicians', { order: 'sort_order' }),
        supabase.fetch('service_packages', { order: 'sort_order', filters: { is_active: 'eq.true' } }),
        supabase.fetch('service_categories', { order: 'sort_order' }),
        supabase.fetch('scheduler_settings'),
        // Exclude deleted appointments from main view
        supabase.fetch('appointments', { 
          order: 'scheduled_date.desc',
          filters: { status: 'neq.deleted' }
        }),
      ]);
      
      setTechnicians(techsData || []);
      setServicePackages(packagesData || []);
      setServiceCategories(categoriesData || []);
      setAppointments(apptsData || []);
      
      const settingsObj = {};
      (settingsData || []).forEach(s => {
        settingsObj[s.setting_key] = s.setting_value;
      });
      setSettings(settingsObj);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setLoading(false);
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  // Appointments for selected date (excluding cancelled/deleted AND on-hold)
  // FIX: Now excludes is_on_hold so they don't show on tech columns
  const dayAppointments = useMemo(() => {
    return appointments.filter(a => 
      a.scheduled_date === selectedDate && 
      a.status !== 'cancelled' && 
      a.status !== 'deleted' &&
      !a.is_on_hold  // <-- THE FIX: Don't show on-hold appointments in tech columns
    );
  }, [appointments, selectedDate]);

  // Techs to show: always show "show_always" techs, plus occasional techs if toggled or have appointments today
  const visibleTechs = useMemo(() => {
    return technicians.filter(tech => {
      // Always show active core techs
      if (tech.is_active && tech.show_always !== false) return true;
      
      // Show occasional techs if toggled on
      if (showOccasionalTechs[tech.id]) return true;
      
      // Show if they have appointments today
      const hasAppointments = dayAppointments.some(a => a.tech_id === tech.id);
      if (hasAppointments) return true;
      
      return false;
    });
  }, [technicians, showOccasionalTechs, dayAppointments]);

  // Occasional techs (can be toggled)
  const occasionalTechs = useMemo(() => {
    return technicians.filter(t => t.is_occasional || t.show_always === false);
  }, [technicians]);

  // Tech hours calculation
  const getTechHours = useCallback((techId, date) => {
    const techAppts = appointments.filter(a => 
      a.tech_id === techId && 
      a.scheduled_date === date && 
      !['cancelled', 'deleted', 'completed'].includes(a.status) &&
      !a.is_on_hold  // Don't count on-hold in tech hours
    );
    const booked = techAppts.reduce((sum, a) => sum + (parseFloat(a.estimated_hours) || 0), 0);
    const tech = technicians.find(t => t.id === techId);
    const total = tech?.hours_per_day || 8;
    return { booked, total, available: total - booked, appointments: techAppts };
  }, [appointments, technicians]);

  // Counts for header buttons
  const counts = useMemo(() => {
    const active = appointments.filter(a => !['cancelled', 'deleted', 'completed'].includes(a.status));
    return {
      noWo: active.filter(a => !a.workorder_created).length,
      noAuth: active.filter(a => a.workorder_created && !a.authorized).length,
      partsNeeded: active.filter(a => a.parts_status === 'needed').length,
      partsOrdered: active.filter(a => ['ordered', 'partial'].includes(a.parts_status)).length,
      partsArrived: active.filter(a => a.parts_status === 'arrived').length,
      onHold: active.filter(a => a.is_on_hold).length,
      requests: appointments.filter(a => a.status === 'request').length,
      deleted: appointments.filter(a => a.status === 'deleted').length,
    };
  }, [appointments]);

  // Filter functions for list modals
  const getFilteredAppointments = useCallback((filterType) => {
    switch (filterType) {
      case 'no_wo':
        return appointments.filter(a => !a.workorder_created && !['cancelled', 'deleted'].includes(a.status));
      case 'needs_auth':
        return appointments.filter(a => a.workorder_created && !a.authorized && !['cancelled', 'deleted'].includes(a.status));
      case 'parts_needed':
        return appointments.filter(a => a.parts_status === 'needed' && !['cancelled', 'deleted'].includes(a.status));
      case 'parts_ordered':
        return appointments.filter(a => ['ordered', 'partial'].includes(a.parts_status) && !['cancelled', 'deleted'].includes(a.status));
      case 'parts_arrived':
        return appointments.filter(a => a.parts_status === 'arrived' && !['cancelled', 'deleted'].includes(a.status));
      case 'on_hold':
        return appointments.filter(a => a.is_on_hold && !['cancelled', 'deleted'].includes(a.status));
      case 'deleted':
        return appointments.filter(a => a.status === 'deleted');
      case 'requests':
        return appointments.filter(a => a.status === 'request');
      default:
        return appointments.filter(a => !['cancelled', 'deleted'].includes(a.status));
    }
  }, [appointments]);

  // ============================================
  // HANDLERS
  // ============================================
  
  const navigateWeek = (dir) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (dir * 7));
    setCurrentDate(newDate);
    setSelectedDate(getWeekDates(newDate)[0]);
  };

  const handleSaveAppointment = async (apptData) => {
    // Block weekend bookings
    if (apptData.scheduled_date && isWeekend(apptData.scheduled_date)) {
      alert('Cannot book appointments on weekends. Please select a weekday.');
      return;
    }
    
    try {
      if (editingAppointment) {
        await supabase.update('appointments', editingAppointment.id, apptData);
      } else {
        await supabase.insert('appointments', apptData);
      }
      await loadAllData();
      setShowBookingModal(false);
      setEditingAppointment(null);
    } catch (err) {
      console.error('Failed to save appointment:', err);
    }
  };

  const handleUpdateAppointment = async (id, updates) => {
    // Block weekend moves
    if (updates.scheduled_date && isWeekend(updates.scheduled_date)) {
      alert('Cannot move appointments to weekends.');
      return;
    }
    
    try {
      await supabase.update('appointments', id, updates);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    } catch (err) {
      console.error('Failed to update appointment:', err);
    }
  };

  // SOFT DELETE - marks as deleted instead of removing
  const handleDeleteAppointment = async (id) => {
    if (!confirm('Delete this appointment? It can be restored later.')) return;
    try {
      await supabase.softDelete('appointments', id);
      setAppointments(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'deleted', deleted_at: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Failed to delete appointment:', err);
    }
  };

  // Restore deleted appointment
  const handleRestoreAppointment = async (id) => {
    try {
      await supabase.update('appointments', id, { status: 'scheduled', deleted_at: null });
      await loadAllData();
    } catch (err) {
      console.error('Failed to restore appointment:', err);
    }
  };

  // Clone appointment (for rebooking from deleted)
  const handleCloneAppointment = async (appointment) => {
    const { id, created_at, updated_at, deleted_at, ...cloneData } = appointment;
    cloneData.status = 'scheduled';
    cloneData.scheduled_date = null; // Let them pick new date
    setEditingAppointment(null);
    // Pre-fill the booking modal with cloned data
    // For now, just open modal - in future could pre-fill
    setShowBookingModal(true);
  };

  // Drag & Drop
  const handleDragStart = (appt) => {
    setDraggedJob(appt);
  };

  const handleDragEnd = () => {
    setDraggedJob(null);
  };

  const handleDrop = async (techId, date) => {
    if (!draggedJob) return;
    
    // Block weekend drops
    if (isWeekend(date)) {
      alert('Cannot schedule appointments on weekends.');
      setDraggedJob(null);
      return;
    }
    
    // Same position - no change
    if (draggedJob.tech_id === techId && draggedJob.scheduled_date === date && !draggedJob.is_on_hold) {
      setDraggedJob(null);
      return;
    }
    
    // If dropping from hold back to calendar
    if (draggedJob.is_on_hold) {
      // TODO: Show modal asking "Assign all lines to this tech/date, or split?"
      // For now, just move it
      await handleUpdateAppointment(draggedJob.id, { 
        tech_id: techId, 
        scheduled_date: date,
        is_on_hold: false,
        hold_reason: null,
        hold_at: null
      });
    } else {
      await handleUpdateAppointment(draggedJob.id, { 
        tech_id: techId, 
        scheduled_date: date 
      });
    }
    
    setDraggedJob(null);
  };

  // Handle drop to hold column
  const handleDropToHold = async (appt) => {
    // TODO: Show split modal to ask which lines to put on hold
    // For now, just put whole thing on hold
    await handleUpdateAppointment(appt.id, {
      is_on_hold: true,
      hold_at: new Date().toISOString(),
      original_scheduled_date: appt.scheduled_date,
      original_tech_id: appt.tech_id
    });
  };

  const openListModal = (filterType, title) => {
    setListModal({ isOpen: true, title, filter: filterType });
  };

  const openDetailModal = (appointment) => {
    setDetailModal({ isOpen: true, appointment });
    setListModal({ ...listModal, isOpen: false });
  };

  const handleDetailSave = () => {
    loadAllData();
    setDetailModal({ isOpen: false, appointment: null });
  };

 // Toggle occasional tech visibility
  const toggleOccasionalTech = (techId) => {
    const isCurrentlyShown = showOccasionalTechs[techId];
    
    // If trying to hide, check for appointments
    if (isCurrentlyShown) {
      const hasAppointments = dayAppointments.some(a => a.tech_id === techId);
      if (hasAppointments) {
        alert('Cannot hide column - tech has appointments scheduled. Move them first.');
        return;
      }
    }
    
    setShowOccasionalTechs(prev => ({
      ...prev,
      [techId]: !prev[techId]
    }));
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading scheduler...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Sub-Navigation */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-4 py-2 flex items-center justify-between">
          {/* View Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button 
                onClick={() => setActiveView('scheduler')} 
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeView === 'scheduler' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Calendar size={14} className="inline mr-1" /> Schedule
              </button>
              <button 
                onClick={() => setActiveView('morning')} 
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeView === 'morning' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Coffee size={14} className="inline mr-1" /> Morning
              </button>
              <button 
                onClick={() => setActiveView('settings')} 
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeView === 'settings' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Settings size={14} className="inline mr-1" /> Settings
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          {activeView === 'scheduler' && (
            <div className="flex items-center gap-2">
              {/* Status Buttons */}
              <div className="flex items-center gap-1 text-sm">
                <button 
                  onClick={() => openListModal('no_wo', 'No Work Order')}
                  className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <FileText size={14} /> 
                  <span className="hidden sm:inline">No WO</span>
                  <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{counts.noWo}</span>
                </button>
                
                <button 
                  onClick={() => openListModal('needs_auth', 'Needs Authorization')}
                  className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <DollarSign size={14} /> 
                  <span className="hidden sm:inline">No Auth</span>
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full">{counts.noAuth}</span>
                </button>
                
                {/* Parts Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                    <Package size={14} /> 
                    <span className="hidden sm:inline">Parts</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      counts.partsNeeded > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {counts.partsNeeded + counts.partsOrdered}
                    </span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button 
                      onClick={() => openListModal('parts_needed', 'Parts Needed')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex justify-between"
                    >
                      <span>🔴 Needs Parts</span>
                      <span className="text-red-600 font-medium">{counts.partsNeeded}</span>
                    </button>
                    <button 
                      onClick={() => openListModal('parts_ordered', 'Parts Ordered')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex justify-between"
                    >
                      <span>🟡 Ordered/Partial</span>
                      <span className="text-yellow-600 font-medium">{counts.partsOrdered}</span>
                    </button>
                    <button 
                      onClick={() => openListModal('parts_arrived', 'Parts Arrived')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex justify-between"
                    >
                      <span>🟢 Parts Here</span>
                      <span className="text-green-600 font-medium">{counts.partsArrived}</span>
                    </button>
                  </div>
                </div>

                {/* Requests Button with Badge */}
                <button 
                  onClick={() => setRequestsOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors relative"
                >
                  <Bell size={14} />
                  <span className="hidden sm:inline">Requests</span>
                  {counts.requests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {counts.requests}
                    </span>
                  )}
                </button>

                {/* Deleted (less prominent) */}
                {counts.deleted > 0 && (
                  <button 
                    onClick={() => openListModal('deleted', 'Deleted Appointments')}
                    className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                    title="View deleted appointments"
                  >
                    <Trash2 size={14} />
                    <span className="text-xs">{counts.deleted}</span>
                  </button>
                )}
              </div>

              {/* Occasional Tech Toggle (if any exist) */}
              {occasionalTechs.length > 0 && (
                <div className="border-l border-gray-200 pl-2 ml-1">
                  {occasionalTechs.map(tech => (
                    <button
                      key={tech.id}
                      onClick={() => toggleOccasionalTech(tech.id)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        showOccasionalTechs[tech.id] 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={`${showOccasionalTechs[tech.id] ? 'Hide' : 'Show'} ${tech.name}'s column`}
                    >
                      <UserPlus size={12} className="inline mr-1" />
                      {tech.name?.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}

              {/* Search */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search appointments"
              >
                <Search size={18} />
              </button>

              {/* New Appointment */}
              <button 
                onClick={() => { setEditingAppointment(null); setShowBookingModal(true); }} 
                className="flex items-center gap-1.5 px-4 py-1.5 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#0A0094' }}
              >
                <Plus size={16} /> New
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'scheduler' && (
          <SchedulerView 
            technicians={visibleTechs}
            appointments={appointments}
            dayAppointments={dayAppointments}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            weekDates={weekDates}
            currentDate={currentDate}
            navigateWeek={navigateWeek}
            getTechHours={getTechHours}
            onOpenDetail={openDetailModal}
            onUpdateAppointment={handleUpdateAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onDropToHold={handleDropToHold}
            draggedJob={draggedJob}
            servicePackages={servicePackages}
          />
        )}

        {activeView === 'morning' && (
          <MorningView 
            technicians={visibleTechs}
            appointments={appointments}
            selectedDate={selectedDate}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView 
            technicians={technicians}
            setTechnicians={setTechnicians}
            servicePackages={servicePackages}
            setServicePackages={setServicePackages}
            settings={settings}
            setSettings={setSettings}
            onRefresh={loadAllData}
          />
        )}
      </div>

      {/* Modals */}
      {showBookingModal && (
        <BookingModal 
          isOpen={showBookingModal}
          onClose={() => { setShowBookingModal(false); setEditingAppointment(null); }}
          onSave={handleSaveAppointment}
          editingAppointment={editingAppointment}
          technicians={technicians}
          servicePackages={servicePackages}
          serviceCategories={serviceCategories}
          onRefreshServices={loadAllData}
          settings={settings}
          selectedDate={selectedDate}
          blockWeekends={true}
        />
      )}

      <AppointmentListModal
        isOpen={listModal.isOpen}
        onClose={() => setListModal({ isOpen: false, title: '', filter: null })}
        title={listModal.title}
        appointments={listModal.filter ? getFilteredAppointments(listModal.filter) : []}
        onSelectAppointment={openDetailModal}
        onRestoreAppointment={listModal.filter === 'deleted' ? handleRestoreAppointment : null}
        onCloneAppointment={listModal.filter === 'deleted' ? handleCloneAppointment : null}
        showRestoreActions={listModal.filter === 'deleted'}
      />

      <AppointmentDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, appointment: null })}
        appointment={detailModal.appointment}
        technicians={technicians}
        onSave={handleDetailSave}
        onDelete={handleDeleteAppointment}
        onStatusChange={() => loadAllData()}
      />

      {/* TODO: Add SearchModal and RequestsPanel components */}
    </div>
  );
}

// ============================================
// SCHEDULER VIEW - REDESIGNED DATE NAVIGATION
// ============================================
function SchedulerView({ 
  technicians, appointments, dayAppointments, selectedDate, setSelectedDate, 
  weekDates, currentDate, navigateWeek, getTechHours, onOpenDetail, onUpdateAppointment,
  onDeleteAppointment, onDragStart, onDragEnd, onDrop, onDropToHold, draggedJob,
  servicePackages
}) {
  const today = new Date().toISOString().split('T')[0];
  
  // Format week range for header
  const weekStart = new Date(weekDates[0] + 'T00:00:00');
  const weekEnd = new Date(weekDates[4] + 'T00:00:00');
  const weekRangeText = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  
  return (
    <div className="h-full flex flex-col">
      {/* ============================================ */}
      {/* REDESIGNED DATE NAVIGATION - BIGGER & BOLDER */}
      {/* ============================================ */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center h-20">
          {/* Previous Week Button */}
          <button 
            onClick={() => navigateWeek(-1)} 
            className="h-full px-4 flex items-center justify-center hover:bg-gray-50 border-r border-gray-200 transition-colors group"
            title="Previous week"
          >
            <ChevronLeft size={28} className="text-gray-400 group-hover:text-gray-700" />
          </button>

          {/* Day Buttons - Flex to fill space */}
          <div className="flex-1 flex h-full">
            {weekDates.map(d => {
              const dateObj = new Date(d + 'T00:00:00');
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
              const dayNum = dateObj.getDate();
              const isSelected = d === selectedDate;
              const isToday = d === today;
              
              return (
                <button 
                  key={d} 
                  onClick={() => setSelectedDate(d)} 
                  className={`
                    flex-1 flex flex-col items-center justify-center border-r border-gray-200 
                    transition-all relative
                    ${isSelected 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-50 text-gray-700'
                    }
                  `}
                >
                  {/* Today indicator */}
                  {isToday && !isSelected && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                        TODAY
                      </span>
                    </div>
                  )}
                  {isToday && isSelected && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold text-blue-100 bg-blue-500 px-1.5 py-0.5 rounded">
                        TODAY
                      </span>
                    </div>
                  )}
                  
                  {/* Day name */}
                  <span className={`text-xs font-semibold tracking-wide ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                    {dayName}
                  </span>
                  
                  {/* Day number */}
                  <span className={`text-2xl font-bold mt-0.5 ${isSelected ? 'text-white' : ''}`}>
                    {dayNum}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Next Week Button */}
          <button 
            onClick={() => navigateWeek(1)} 
            className="h-full px-4 flex items-center justify-center hover:bg-gray-50 border-l border-gray-200 transition-colors group"
            title="Next week"
          >
            <ChevronRight size={28} className="text-gray-400 group-hover:text-gray-700" />
          </button>

          {/* Today Button + Week Info */}
          <div className="h-full px-4 flex flex-col items-center justify-center border-l border-gray-200 min-w-[140px]">
            <button 
              onClick={() => {
                // Don't allow jumping to weekend
                if (!isWeekend(today)) {
                  setSelectedDate(today);
                  // Also navigate to current week if not there
                  const todayWeek = getWeekDates(new Date());
                  if (!weekDates.includes(today)) {
                    navigateWeek(0); // This won't work, need to recalculate
                  }
                }
              }} 
              className="px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
            <span className="text-[10px] text-gray-400 mt-1">{weekRangeText}</span>
          </div>
        </div>
      </div>

      {/* Tech Columns + Hold Column */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="flex gap-3 h-full">
          {/* Tech Columns - flex equally to fill space */}
          <div className="flex-1 flex gap-3 min-w-0">
            {technicians.map(tech => (
              <TechColumn 
                key={tech.id}
                tech={tech}
                date={selectedDate}
                hours={getTechHours(tech.id, selectedDate)}
                appointments={dayAppointments.filter(a => a.tech_id === tech.id)}
                onOpenDetail={onOpenDetail}
                onUpdateAppointment={onUpdateAppointment}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDrop={onDrop}
                draggedJob={draggedJob}
                servicePackages={servicePackages}
              />
            ))}
          </div>

          {/* Hold Column - fixed width on right */}
          <div className="w-64 flex-shrink-0">
            <StatusColumn
              appointments={appointments}
              selectedDate={selectedDate}
              onSelectAppointment={onOpenDetail}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDropToCalendar={onDropToHold}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TECH COLUMN - EQUAL FLEX WIDTH (no max constraint)
// ============================================
function TechColumn({ 
  tech, date, hours, appointments, onOpenDetail, onUpdateAppointment, 
  onDragStart, onDragEnd, onDrop, draggedJob, servicePackages
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(tech.id, date);
  };

  const utilizationPct = hours.total > 0 ? (hours.booked / hours.total) * 100 : 0;
  const utilizationColor = utilizationPct > 100 ? 'bg-red-500' : utilizationPct > 80 ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div 
      className={`
        flex-1 min-w-[180px] bg-white rounded-lg shadow-sm border 
        transition-all duration-200 flex flex-col
        ${isDragOver ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div 
        className="p-3 border-b border-gray-200 rounded-t-lg flex-shrink-0"
        style={{ backgroundColor: tech.color ? `${tech.color}15` : '#f9fafb' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">{tech.name}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            hours.available < 0 ? 'bg-red-100 text-red-700' : 
            hours.available < 2 ? 'bg-amber-100 text-amber-700' : 
            'bg-green-100 text-green-700'
          }`}>
            {hours.booked.toFixed(1)} / {hours.total}h
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${utilizationColor} transition-all duration-300`} 
            style={{ width: `${Math.min(utilizationPct, 100)}%` }} 
          />
        </div>
      </div>

      {/* Appointments */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {appointments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No appointments</p>
        ) : (
          appointments.map(appt => (
            <AppointmentCard 
              key={appt.id}
              appointment={appt}
              onEdit={() => onOpenDetail(appt)}
              onDragStart={() => onDragStart(appt)}
              onDragEnd={onDragEnd}
              servicePackages={servicePackages}
            />
          ))
        )}
      </div>

      {/* Drop indicator */}
      {isDragOver && (
        <div className="p-2 border-t border-blue-200">
          <div className="h-16 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
            <span className="text-blue-500 text-sm">Drop here</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MORNING VIEW
// ============================================
function MorningView({ technicians, appointments, selectedDate }) {
  const todayAppts = appointments.filter(a => 
    a.scheduled_date === selectedDate && 
    !['cancelled', 'deleted'].includes(a.status) &&
    !a.is_on_hold
  );

  return (
    <div className="p-6 bg-gray-900 min-h-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white">{formatDate(selectedDate)}</h2>
        <p className="text-gray-400">Morning Meeting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {technicians.map(tech => {
          const techAppts = todayAppts.filter(a => a.tech_id === tech.id);
          const totalHours = techAppts.reduce((sum, a) => sum + (parseFloat(a.estimated_hours) || 0), 0);

          return (
            <div key={tech.id} className="bg-gray-800 rounded-xl overflow-hidden">
              <div 
                className="p-4 border-b border-gray-700"
                style={{ backgroundColor: tech.color ? `${tech.color}30` : '#374151' }}
              >
                <h3 className="text-xl font-bold text-white">{tech.name}</h3>
                <p className="text-gray-400 text-sm">{totalHours.toFixed(1)} hours</p>
              </div>

              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {techAppts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No appointments</p>
                ) : (
                  techAppts.map(appt => (
                    <div key={appt.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-white">{appt.customer_name}</div>
                          <div className="text-sm text-gray-300">{appt.vehicle_description}</div>
                        </div>
                        <div className="text-lg font-bold text-gray-300">{appt.estimated_hours}h</div>
                      </div>
                      {appt.services?.length > 0 && (
                        <div className="mt-2 text-sm text-gray-400">
                          {appt.services.map((s, i) => (
                            <div key={i}>• {s.name || s.title}</div>
                          ))}
                        </div>
                      )}
                      {appt.notes && (
                        <div className="mt-2 text-xs text-yellow-400 bg-yellow-900/30 rounded p-2">
                          📝 {appt.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
