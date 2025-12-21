import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, Car, History, Package, Plus, Phone, Mail, MapPin, Building,
  Calendar, DollarSign, Clock, Gauge, FileText, ChevronDown, ChevronUp,
  MessageSquare, AlertTriangle, Star, Check, Bell, BellOff, Hash,
  TrendingUp, Receipt, Search, X, Settings, ClipboardList, Wrench, Eye
} from 'lucide-react';

// ============================================
// CustomerPanel Component
// Tabbed interface for customer info, vehicles, history, services
// ============================================

// Format helpers
const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '$0.00';
  return '$' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
};

// Tab configuration
const TABS = [
  { id: 'info', label: 'Info', icon: User },
  { id: 'vehicles', label: 'Vehicles', icon: Car },
  { id: 'history', label: 'History', icon: History },
  { id: 'services', label: 'Services', icon: Package },
];

export function CustomerPanel({
  customer,
  vehicles = [],
  selectedVehicle,
  onSelectVehicle,
  onAddNewVehicle,
  newVehicleData,
  onNewVehicleChange,
  servicePackages = [],
  serviceCategories = [],
  onAddService,
  addedServices = [],
  loading = false,
  onOpenSettings
}) {
  const [activeTab, setActiveTab] = useState('info');
  const [expandedWO, setExpandedWO] = useState(null);
  const [historyModalVehicle, setHistoryModalVehicle] = useState(null);

  // Handler for changing vehicle with confirmation
  const handleVehicleChange = (vehicle) => {
    // If same vehicle, deselect
    if (selectedVehicle?.vin === vehicle?.vin && !selectedVehicle?.isNew) {
      onSelectVehicle(null);
      return;
    }
    
    // If quote has items, confirm
    if (addedServices.length > 0) {
      if (confirm('Changing vehicle will clear the current quote. Continue?')) {
        onSelectVehicle(vehicle);
      }
    } else {
      onSelectVehicle(vehicle);
    }
  };

  // Collect all work orders across all vehicles for History tab
  const allWorkOrders = useMemo(() => {
    const wos = [];
    vehicles.forEach(v => {
      (v.history || []).forEach(wo => {
        wos.push({
          ...wo,
          vehicle: v,
          vehicleDesc: `${v.year} ${v.make} ${v.model}`.trim() || 'Unknown'
        });
      });
    });
    // Sort by date descending
    return wos.sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));
  }, [vehicles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 flex-shrink-0 bg-white">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.id === 'vehicles' && vehicles.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {vehicles.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {activeTab === 'info' && (
          <InfoTab 
            customer={customer} 
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={handleVehicleChange}
            onAddNewVehicle={onAddNewVehicle}
            newVehicleData={newVehicleData}
            onNewVehicleChange={onNewVehicleChange}
            onViewHistory={setHistoryModalVehicle}
          />
        )}
        
        {activeTab === 'vehicles' && (
          <VehiclesTab
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={handleVehicleChange}
            onAddNewVehicle={onAddNewVehicle}
            newVehicleData={newVehicleData}
            onNewVehicleChange={onNewVehicleChange}
            onViewHistory={setHistoryModalVehicle}
          />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab
            workOrders={allWorkOrders}
            expandedWO={expandedWO}
            setExpandedWO={setExpandedWO}
            viewOnly={true}
          />
        )}
        
        {activeTab === 'services' && (
          <ServicesTab
            servicePackages={servicePackages}
            serviceCategories={serviceCategories}
            selectedVehicle={selectedVehicle}
            vehicles={vehicles}
            onAddService={onAddService}
            addedServices={addedServices}
            onOpenSettings={onOpenSettings}
          />
        )}
      </div>

      {/* Vehicle History Modal */}
      {historyModalVehicle && (
        <VehicleHistoryModal
          vehicle={historyModalVehicle}
          onClose={() => setHistoryModalVehicle(null)}
          onSwitchVehicle={(v) => {
            handleVehicleChange(v);
            setHistoryModalVehicle(null);
          }}
          isCurrentVehicle={selectedVehicle?.vin === historyModalVehicle.vin}
        />
      )}
    </div>
  );
}

// ============================================
// INFO TAB
// ============================================
function InfoTab({ customer, vehicles, selectedVehicle, onSelectVehicle, onAddNewVehicle, newVehicleData, onNewVehicleChange, onViewHistory }) {
  // Handle different possible field names from contacts table
  const customerSince = customer?.customer_since || customer?.created_at;
  const lifetimeVisits = customer?.lifetime_visits || customer?.total_visits;
  const lifetimeSpent = customer?.lifetime_spent || customer?.total_spent;
  const avgVisitValue = customer?.avg_visit_value || (lifetimeSpent && lifetimeVisits ? lifetimeSpent / lifetimeVisits : null);
  const lastVisitDate = customer?.last_visit_date || customer?.last_service_date;
  const daysSinceVisitVal = lastVisitDate ? daysSince(lastVisitDate) : customer?.days_since_visit;

  // Sort vehicles: overdue first, then by days since visit (longest first)
  const sortedVehicles = [...vehicles].sort((a, b) => {
    const aDays = (a.last_seen_at || a.history?.[0]?.invoice_date) ? daysSince(a.last_seen_at || a.history?.[0]?.invoice_date) : 9999;
    const bDays = (b.last_seen_at || b.history?.[0]?.invoice_date) ? daysSince(b.last_seen_at || b.history?.[0]?.invoice_date) : 9999;
    const aOverdue = aDays > 180;
    const bOverdue = bDays > 180;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return bDays - aDays;
  });
  
  const overdueCount = sortedVehicles.filter(v => {
    const days = (v.last_seen_at || v.history?.[0]?.invoice_date) ? daysSince(v.last_seen_at || v.history?.[0]?.invoice_date) : null;
    return days && days > 180;
  }).length;
  
  return (
    <div className="space-y-3">
      {/* Client Summary - Single row */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {customerSince ? new Date(customerSince).getFullYear() : '—'}
              </span>
              <span className="text-xs text-gray-500 ml-1">client since</span>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">Visits </span>
                <span className="font-semibold text-gray-900">{lifetimeVisits?.toLocaleString() || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">Total </span>
                <span className="font-semibold text-gray-900">{lifetimeSpent ? formatMoney(lifetimeSpent) : '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">Avg </span>
                <span className="font-semibold text-gray-900">{avgVisitValue ? formatMoney(avgVisitValue) : '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">Last </span>
                <span className={`font-semibold ${daysSinceVisitVal > 180 ? 'text-red-600' : daysSinceVisitVal > 120 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {daysSinceVisitVal ? `${daysSinceVisitVal}d ago` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Preferences */}
      {(customer?.prefers_call || customer?.prefers_text || customer?.prefers_email || customer?.do_not_contact || customer?.no_marketing) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Contact:</span>
          {customer?.prefers_call && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
              <Phone size={11} /> Prefers Phone
            </span>
          )}
          {customer?.prefers_text && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              <MessageSquare size={11} /> Prefers Text
            </span>
          )}
          {customer?.prefers_email && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
              <Mail size={11} /> Prefers Email
            </span>
          )}
          {customer?.do_not_contact && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
              <BellOff size={11} /> Do Not Contact
            </span>
          )}
          {customer?.no_marketing && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">No Marketing</span>
          )}
        </div>
      )}

      {/* Customer Notes */}
      {customer?.notes && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 mb-1">
            <AlertTriangle size={12} />
            Customer Notes
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
        </div>
      )}

      {/* Vehicle List - Clickable to select */}
      <div className={`border rounded-lg overflow-hidden ${overdueCount > 0 ? 'border-red-200' : 'border-gray-200'}`}>
        <div className={`px-3 py-2 border-b flex items-center justify-between ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
          <span className="text-sm font-medium text-gray-700">Select Vehicle ({vehicles.length})</span>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <span className="text-xs font-medium text-white bg-red-500 px-2 py-0.5 rounded-full">
                {overdueCount} due
              </span>
            )}
            <button
              onClick={() => onAddNewVehicle({ isNew: true, year: '', make: '', model: '', vin: '', plate: '' })}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <Plus size={12} /> New
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {sortedVehicles.map((v, i) => {
            const lastVisit = v.last_seen_at || v.history?.[0]?.invoice_date;
            const days = lastVisit ? daysSince(lastVisit) : null;
            const isOverdue = days && days > 180;
            const isWarning = days && days > 120 && days <= 180;
            const isSelected = selectedVehicle?.vin === v.vin && !selectedVehicle?.isNew;
            
            return (
              <button
                key={i}
                onClick={() => onSelectVehicle(isSelected ? null : v)}
                className={`w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors ${
                  isSelected ? 'bg-blue-100 hover:bg-blue-100' :
                  isOverdue ? 'bg-red-50 hover:bg-red-100' : 
                  isWarning ? 'bg-amber-50 hover:bg-amber-100' : 
                  'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isSelected ? (
                    <Check size={16} className="text-blue-600 flex-shrink-0" />
                  ) : (
                    <Car size={16} className={`flex-shrink-0 ${isOverdue ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-400'}`} />
                  )}
                  <span className={`text-sm truncate ${isSelected ? 'font-semibold text-blue-900' : 'text-gray-900'}`}>
                    {v.year} {v.make} {v.model}
                  </span>
                  {isOverdue && (
                    <span className="flex-shrink-0 text-xs text-white bg-red-500 px-1.5 py-0.5 rounded font-medium">DUE</span>
                  )}
                  {isWarning && !isOverdue && (
                    <span className="flex-shrink-0 text-xs text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded font-medium">SOON</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {v.plate && <span className="text-xs text-gray-500 font-mono">{v.plate}</span>}
                  {days !== null && (
                    <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : isWarning ? 'text-amber-600' : 'text-gray-400'}`}>
                      {days}d
                    </span>
                  )}
                  {/* History button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewHistory(v);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="View history"
                  >
                    <ClipboardList size={14} />
                  </button>
                </div>
              </button>
            );
          })}
          {vehicles.length === 0 && (
            <div className="px-3 py-6 text-center">
              <Car size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No vehicles on file</p>
              <button
                onClick={() => onAddNewVehicle({ isNew: true, year: '', make: '', model: '', vin: '', plate: '' })}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add First Vehicle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// VEHICLES TAB
// ============================================
function VehiclesTab({ 
  vehicles, 
  selectedVehicle, 
  onSelectVehicle, 
  onAddNewVehicle,
  newVehicleData,
  onNewVehicleChange,
  onViewHistory
}) {
  // Sort vehicles: overdue first, then by days since visit (longest first)
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      const aDays = (a.last_seen_at || a.history?.[0]?.invoice_date) ? daysSince(a.last_seen_at || a.history?.[0]?.invoice_date) : 9999;
      const bDays = (b.last_seen_at || b.history?.[0]?.invoice_date) ? daysSince(b.last_seen_at || b.history?.[0]?.invoice_date) : 9999;
      const aOverdue = aDays > 180;
      const bOverdue = bDays > 180;
      // Overdue vehicles first
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      // Then by longest since visit
      return bDays - aDays;
    });
  }, [vehicles]);

  return (
    <div className="space-y-2">
      {/* Add New Vehicle - at top */}
      <button
        onClick={() => onAddNewVehicle({ isNew: true, year: '', make: '', model: '', vin: '', plate: '' })}
        className={`w-full text-left p-3 rounded-lg border-2 border-dashed transition-all ${
          newVehicleData?.isNew 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2 text-gray-600">
          <Plus size={18} />
          <span className="font-medium">Add New Vehicle</span>
        </div>
      </button>

      {newVehicleData?.isNew && (
        <NewVehicleForm data={newVehicleData} onChange={onNewVehicleChange} />
      )}

      {/* Existing vehicles */}
      {sortedVehicles.map(v => {
        const isSelected = selectedVehicle?.vin === v.vin && !selectedVehicle?.isNew;
        const lastVisit = v.last_seen_at || v.history?.[0]?.invoice_date;
        const days = lastVisit ? daysSince(lastVisit) : null;
        const isOverdue = days && days > 180;
        const isWarning = days && days > 120 && days <= 180;
        
        return (
          <div 
            key={v.vin}
            className={`rounded-lg border transition-all ${
              isSelected 
                ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                : isOverdue
                  ? 'border-red-300 bg-red-50 hover:border-red-400'
                  : isWarning
                    ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                    : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onSelectVehicle(isSelected ? null : v)}
                  className="flex items-center gap-2 flex-1"
                >
                  {isSelected ? (
                    <Check size={16} className="text-blue-600" />
                  ) : (
                    <Car size={16} className={isOverdue ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-400'} />
                  )}
                  <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {v.year} {v.make} {v.model}
                  </span>
                  {isOverdue && (
                    <span className="text-xs text-white bg-red-500 px-1.5 py-0.5 rounded font-medium">DUE</span>
                  )}
                  {isWarning && !isOverdue && (
                    <span className="text-xs text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded font-medium">SOON</span>
                  )}
                </button>
                {/* View History button */}
                <button
                  onClick={() => onViewHistory(v)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="View service history"
                >
                  <ClipboardList size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 ml-6">
                {v.plate && <span className="font-mono">{v.plate}</span>}
                {v.last_mileage && <span>{parseInt(v.last_mileage).toLocaleString()} km</span>}
                {days !== null && (
                  <span className={isOverdue ? 'text-red-600 font-medium' : isWarning ? 'text-amber-600 font-medium' : ''}>
                    {days} days ago
                  </span>
                )}
                {v.history?.length > 0 && (
                  <span className="text-gray-400">{v.history.length} work orders</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// HISTORY TAB - All work orders chronologically (view-only)
// ============================================
function HistoryTab({ workOrders, expandedWO, setExpandedWO, viewOnly = false }) {
  if (workOrders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <History size={32} className="mx-auto mb-2 opacity-50" />
        <p>No service history</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {viewOnly && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
          <Eye size={14} />
          <span>View-only mode. Use the <strong>Services</strong> tab to add items to quote.</span>
        </div>
      )}
      {workOrders.map((wo, idx) => {
        const isExpanded = expandedWO === wo.workorder_number;
        const completed = (wo.completed_packages || []).filter(p => !p.is_header && parseFloat(p.total) > 0);
        const deferred = (wo.deferred_packages || []).filter(p => !p.is_header && parseFloat(p.total) > 0);
        
        return (
          <div key={`${wo.workorder_number}-${idx}`} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => setExpandedWO(isExpanded ? null : wo.workorder_number)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={14} className="text-gray-400" />
                  <span className="font-medium text-gray-900">WO #{wo.workorder_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{formatMoney(wo.grand_total)}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>{formatDate(wo.invoice_date)}</span>
                <span className="text-gray-300">•</span>
                <span>{wo.vehicleDesc}</span>
                {completed.length > 0 && (
                  <span className="text-green-600">{completed.length} completed</span>
                )}
                {deferred.length > 0 && (
                  <span className="text-red-500">{deferred.length} deferred</span>
                )}
              </div>
            </button>
            
            {isExpanded && (
              <div className="border-t border-gray-100">
                {/* Completed items */}
                {completed.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    <div className="px-3 py-1.5 bg-green-50 text-xs font-medium text-green-700">
                      Completed Work
                    </div>
                    {completed.map((pkg, pIdx) => (
                      <div key={pIdx} className="px-3 py-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">{pkg.title}</span>
                          <span className="text-gray-600">{formatMoney(pkg.total)}</span>
                        </div>
                        {pkg.labor_hours && (
                          <div className="text-xs text-gray-400 mt-0.5">{pkg.labor_hours}h labor</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Deferred items */}
                {deferred.length > 0 && (
                  <div className="divide-y divide-red-50 bg-red-50/50">
                    <div className="px-3 py-1.5 bg-red-50 text-xs font-medium text-red-700 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Deferred Work
                    </div>
                    {deferred.sort((a, b) => (a.ordinal || 999) - (b.ordinal || 999)).map((pkg, dIdx) => (
                      <div key={dIdx} className="px-3 py-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-red-700">{pkg.title}</span>
                          <span className="text-red-600">{formatMoney(pkg.total)}</span>
                        </div>
                        {pkg.labor_hours && (
                          <div className="text-xs text-red-400 mt-0.5">{pkg.labor_hours}h labor</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// SERVICES TAB - Sub-tabs: Canned Jobs / Vehicle History
// ============================================
function ServicesTab({ servicePackages, serviceCategories = [], selectedVehicle, vehicles = [], onAddService, addedServices, onOpenSettings }) {
  const [activeSubTab, setActiveSubTab] = useState('canned');
  const [customJob, setCustomJob] = useState({ name: '', price: '', hours: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedWO, setExpandedWO] = useState(null);
  
  // Get selected vehicle's history
  const vehicleHistory = useMemo(() => {
    if (!selectedVehicle || selectedVehicle.isNew) return [];
    const v = vehicles.find(veh => veh.vin === selectedVehicle.vin);
    return v?.history || [];
  }, [selectedVehicle, vehicles]);
  
  // Get default expanded categories from settings, or fallback
  const defaultExpanded = useMemo(() => {
    return serviceCategories
      .filter(c => !c.is_collapsed_default && !c.is_hidden)
      .map(c => c.id);
  }, [serviceCategories]);
  
  const [expandedCategories, setExpandedCategories] = useState(defaultExpanded.length > 0 ? defaultExpanded : ['oil']);

  // Update expanded when categories change
  useEffect(() => {
    if (defaultExpanded.length > 0) {
      setExpandedCategories(defaultExpanded);
    }
  }, [serviceCategories]);

  // Sort categories by their order
  const sortedCategoryIds = useMemo(() => {
    return serviceCategories
      .filter(c => !c.is_hidden)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(c => c.id);
  }, [serviceCategories]);

  // Group packages by category
  const grouped = useMemo(() => {
    const groups = {};
    servicePackages
      .filter(pkg => pkg.is_active !== false)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .forEach(pkg => {
        const cat = pkg.category || 'general';
        const catSettings = serviceCategories.find(c => c.id === cat);
        if (catSettings?.is_hidden) return;
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(pkg);
      });
    return groups;
  }, [servicePackages, serviceCategories]);

  const favorites = useMemo(() => {
    return servicePackages.filter(pkg => pkg.is_favorite && pkg.is_active !== false);
  }, [servicePackages]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return grouped;
    const term = searchTerm.toLowerCase();
    const filtered = {};
    Object.entries(grouped).forEach(([category, packages]) => {
      const matchingPkgs = packages.filter(pkg => 
        pkg.name.toLowerCase().includes(term) ||
        category.toLowerCase().includes(term)
      );
      if (matchingPkgs.length > 0) {
        filtered[category] = matchingPkgs;
      }
    });
    return filtered;
  }, [grouped, searchTerm]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAddCustom = () => {
    if (!customJob.name.trim()) return;
    onAddService(
      { name: customJob.name, title: customJob.name },
      parseFloat(customJob.price) || 0,
      parseFloat(customJob.hours) || 1,
      'custom',
      null
    );
    setCustomJob({ name: '', price: '', hours: '' });
  };

  const handleAddPackage = (pkg) => {
    const price = parseFloat(pkg.base_price) || parseFloat(pkg.default_price) || 0;
    const hours = parseFloat(pkg.base_hours) || parseFloat(pkg.default_hours) || 1;
    onAddService(
      { id: pkg.id, name: pkg.name, title: pkg.name },
      price,
      hours,
      'package',
      null
    );
  };

  const handleAddFromHistory = (pkg, woNumber) => {
    onAddService(
      { name: pkg.title, title: pkg.title, from_wo: woNumber },
      parseFloat(pkg.total) || 0,
      parseFloat(pkg.labor_hours) || 1,
      'history',
      null
    );
  };

  const sortedGroups = useMemo(() => {
    const entries = Object.entries(filteredGroups);
    return entries.sort((a, b) => {
      const aIdx = sortedCategoryIds.indexOf(a[0]);
      const bIdx = sortedCategoryIds.indexOf(b[0]);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
  }, [filteredGroups, sortedCategoryIds]);

  return (
    <div className="space-y-3">
      {/* Sub-tab bar */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('canned')}
          className={`flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
            activeSubTab === 'canned'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wrench size={14} />
          Canned Jobs
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          disabled={!selectedVehicle || selectedVehicle.isNew}
          className={`flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
            activeSubTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : !selectedVehicle || selectedVehicle.isNew
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={14} />
          Vehicle History
          {vehicleHistory.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 rounded-full">
              {vehicleHistory.length}
            </span>
          )}
        </button>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-3 text-gray-400 hover:text-gray-600 border-l border-gray-200"
            title="Service Settings"
          >
            <Settings size={16} />
          </button>
        )}
      </div>

      {/* CANNED JOBS SUB-TAB */}
      {activeSubTab === 'canned' && (
        <>
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Favorites */}
          {favorites.length > 0 && !searchTerm.trim() && (
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-yellow-100 border-b border-yellow-200 flex items-center gap-2">
                <Star size={14} className="text-yellow-600 fill-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Favorites</span>
              </div>
              <div className="divide-y divide-yellow-100">
                {favorites.map(pkg => {
                  const price = parseFloat(pkg.base_price) || parseFloat(pkg.default_price) || 0;
                  const hours = parseFloat(pkg.base_hours) || parseFloat(pkg.default_hours) || 1;
                  const isAdded = addedServices.some(s => s.package_id === pkg.id);
                  
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => !isAdded && handleAddPackage(pkg)}
                      disabled={isAdded}
                      className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                        isAdded ? 'bg-green-50' : 'hover:bg-yellow-100'
                      }`}
                    >
                      <div className="flex-1">
                        <div className={`text-sm ${isAdded ? 'text-gray-400' : 'text-gray-900'}`}>{pkg.name}</div>
                        <div className="text-xs text-gray-500">{hours}h • {formatMoney(price)}</div>
                      </div>
                      <span className={isAdded ? 'text-green-600' : 'text-gray-400'}>
                        {isAdded ? <Check size={16} /> : <Plus size={16} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Job */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Add Custom Service</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customJob.name}
                onChange={(e) => setCustomJob(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Service name"
                className="flex-1 border rounded px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                value={customJob.price}
                onChange={(e) => setCustomJob(prev => ({ ...prev, price: e.target.value }))}
                placeholder="$"
                className="w-20 border rounded px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                step="0.5"
                value={customJob.hours}
                onChange={(e) => setCustomJob(prev => ({ ...prev, hours: e.target.value }))}
                placeholder="hrs"
                className="w-16 border rounded px-2 py-1.5 text-sm"
              />
              <button
                onClick={handleAddCustom}
                disabled={!customJob.name.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Grouped Packages */}
          {sortedGroups.map(([category, packages]) => {
            const isExpanded = searchTerm.trim() || expandedCategories.includes(category);
            const addedCount = packages.filter(pkg => addedServices.some(s => s.package_id === pkg.id)).length;
            const catInfo = serviceCategories.find(c => c.id === category);
            const displayName = catInfo?.name || category;
            
            return (
              <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => !searchTerm.trim() && toggleCategory(category)}
                  className="w-full px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{displayName}</span>
                    <span className="text-xs text-gray-400">({packages.length})</span>
                    {addedCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">
                        {addedCount} added
                      </span>
                    )}
                  </div>
                  {!searchTerm.trim() && (
                    isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {packages.map(pkg => {
                      const price = parseFloat(pkg.base_price) || parseFloat(pkg.default_price) || 0;
                      const hours = parseFloat(pkg.base_hours) || parseFloat(pkg.default_hours) || 1;
                      const isAdded = addedServices.some(s => s.package_id === pkg.id);
                      
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => !isAdded && handleAddPackage(pkg)}
                          disabled={isAdded}
                          className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                            isAdded ? 'bg-green-50' : 'hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className={`text-sm ${isAdded ? 'text-gray-400' : 'text-gray-900'}`}>
                              {pkg.is_favorite && <Star size={12} className="inline text-yellow-500 fill-yellow-500 mr-1" />}
                              {pkg.name}
                              {pkg.is_custom && <span className="ml-1 text-xs text-green-600">(custom)</span>}
                            </div>
                            <div className="text-xs text-gray-500">{hours}h • {formatMoney(price)}</div>
                          </div>
                          <span className={isAdded ? 'text-green-600' : 'text-gray-400'}>
                            {isAdded ? <Check size={16} /> : <Plus size={16} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {searchTerm.trim() && Object.keys(filteredGroups).length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <Package size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No services match "{searchTerm}"</p>
            </div>
          )}
        </>
      )}

      {/* VEHICLE HISTORY SUB-TAB */}
      {activeSubTab === 'history' && (
        <>
          {!selectedVehicle || selectedVehicle.isNew ? (
            <div className="text-center py-8 text-gray-400">
              <Car size={32} className="mx-auto mb-2 opacity-50" />
              <p>Select a vehicle to view history</p>
            </div>
          ) : vehicleHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <History size={32} className="mx-auto mb-2 opacity-50" />
              <p>No service history for this vehicle</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Click <Plus size={12} className="inline" /> to add items to quote
              </p>
              {vehicleHistory.map((wo, idx) => {
                const isExpanded = expandedWO === wo.workorder_number;
                const completed = (wo.completed_packages || []).filter(p => !p.is_header && parseFloat(p.total) > 0);
                const deferred = (wo.deferred_packages || []).filter(p => !p.is_header && parseFloat(p.total) > 0);
                
                return (
                  <div key={`${wo.workorder_number}-${idx}`} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                    <button
                      onClick={() => setExpandedWO(isExpanded ? null : wo.workorder_number)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Receipt size={14} className="text-gray-400" />
                          <span className="font-medium text-gray-900">WO #{wo.workorder_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{formatMoney(wo.grand_total)}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{formatDate(wo.invoice_date)}</span>
                        {completed.length > 0 && (
                          <span className="text-green-600">{completed.length} completed</span>
                        )}
                        {deferred.length > 0 && (
                          <span className="text-red-500">{deferred.length} deferred</span>
                        )}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        {completed.length > 0 && (
                          <div className="divide-y divide-gray-50">
                            <div className="px-3 py-1.5 bg-green-50 text-xs font-medium text-green-700">
                              Completed Work
                            </div>
                            {completed.map((pkg, pIdx) => {
                              const isAdded = addedServices.some(s => s.name === pkg.title);
                              return (
                                <div key={pIdx} className={`px-3 py-2 flex items-center justify-between ${isAdded ? 'bg-green-50' : ''}`}>
                                  <div className="flex-1">
                                    <div className={`text-sm ${isAdded ? 'text-gray-400' : 'text-gray-700'}`}>{pkg.title}</div>
                                    <div className="text-xs text-gray-500">
                                      {pkg.labor_hours && `${pkg.labor_hours}h • `}{formatMoney(pkg.total)}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => !isAdded && handleAddFromHistory(pkg, wo.workorder_number)}
                                    disabled={isAdded}
                                    className={`p-1 rounded ${isAdded ? 'text-green-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                  >
                                    {isAdded ? <Check size={16} /> : <Plus size={16} />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {deferred.length > 0 && (
                          <div className="divide-y divide-red-50 bg-red-50/50">
                            <div className="px-3 py-1.5 bg-red-50 text-xs font-medium text-red-700 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              Deferred Work
                            </div>
                            {deferred.sort((a, b) => (a.ordinal || 999) - (b.ordinal || 999)).map((pkg, dIdx) => {
                              const isAdded = addedServices.some(s => s.name === pkg.title);
                              return (
                                <div key={dIdx} className={`px-3 py-2 flex items-center justify-between ${isAdded ? 'bg-green-50' : ''}`}>
                                  <div className="flex-1">
                                    <div className={`text-sm ${isAdded ? 'text-gray-400' : 'text-red-700'}`}>{pkg.title}</div>
                                    <div className="text-xs text-red-500">
                                      {pkg.labor_hours && `${pkg.labor_hours}h • `}{formatMoney(pkg.total)}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => !isAdded && handleAddFromHistory(pkg, wo.workorder_number)}
                                    disabled={isAdded}
                                    className={`p-1 rounded ${isAdded ? 'text-green-600' : 'text-red-400 hover:text-red-600 hover:bg-red-100'}`}
                                  >
                                    {isAdded ? <Check size={16} /> : <Plus size={16} />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// VEHICLE HISTORY MODAL
// ============================================
function VehicleHistoryModal({ vehicle, onClose, onSwitchVehicle, isCurrentVehicle }) {
  const [expandedWO, setExpandedWO] = useState(null);
  const history = vehicle?.history || [];
  
  const lastVisit = vehicle.last_seen_at || history[0]?.invoice_date;
  const days = lastVisit ? daysSince(lastVisit) : null;
  const isOverdue = days && days > 180;
  const isWarning = days && days > 120 && days <= 180;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between ${
          isOverdue ? 'bg-red-50 border-red-200' : 
          isWarning ? 'bg-amber-50 border-amber-200' : 
          'bg-gray-50 border-gray-200'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <Car size={18} className={isOverdue ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-600'} />
              <h3 className="font-semibold text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
              {isOverdue && <span className="text-xs text-white bg-red-500 px-1.5 py-0.5 rounded font-medium">DUE</span>}
              {isWarning && !isOverdue && <span className="text-xs text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded font-medium">SOON</span>}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
              {vehicle.plate && <span className="font-mono">{vehicle.plate}</span>}
              {vehicle.last_mileage && <span>{parseInt(vehicle.last_mileage).toLocaleString()} km</span>}
              {days !== null && <span>{days} days since last service</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={18} />
          </button>
        </div>
        
        {/* Switch Vehicle button */}
        {!isCurrentVehicle && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
            <button
              onClick={() => onSwitchVehicle(vehicle)}
              className="text-sm text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1"
            >
              <Check size={14} />
              Switch to this vehicle for appointment
            </button>
          </div>
        )}
        {isCurrentVehicle && (
          <div className="px-4 py-2 bg-green-50 border-b border-green-200 text-sm text-green-700 flex items-center gap-1">
            <Check size={14} />
            Currently selected vehicle
          </div>
        )}

        {/* History */}
        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <History size={32} className="mx-auto mb-2 opacity-50" />
              <p>No service history for this vehicle</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((wo, idx) => {
                const isExpanded = expandedWO === wo.workorder_number;
                const completed = (wo.completed_packages || []).filter(p => !p.is_header && parseFloat(p.total) > 0);
                const deferred = (wo.deferred_packages || []).filter(p => !p.is_header && parseFloat(p.total) > 0);
                
                return (
                  <div key={`${wo.workorder_number}-${idx}`} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                    <button
                      onClick={() => setExpandedWO(isExpanded ? null : wo.workorder_number)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Receipt size={14} className="text-gray-400" />
                          <span className="font-medium text-gray-900">WO #{wo.workorder_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{formatMoney(wo.grand_total)}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{formatDate(wo.invoice_date)}</span>
                        {completed.length > 0 && <span className="text-green-600">{completed.length} completed</span>}
                        {deferred.length > 0 && <span className="text-red-500">{deferred.length} deferred</span>}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        {completed.length > 0 && (
                          <div className="divide-y divide-gray-50">
                            <div className="px-3 py-1.5 bg-green-50 text-xs font-medium text-green-700">
                              Completed Work
                            </div>
                            {completed.map((pkg, pIdx) => (
                              <div key={pIdx} className="px-3 py-2 text-sm flex justify-between">
                                <span className="text-gray-700">{pkg.title}</span>
                                <span className="text-gray-600">{formatMoney(pkg.total)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {deferred.length > 0 && (
                          <div className="divide-y divide-red-50 bg-red-50/50">
                            <div className="px-3 py-1.5 bg-red-50 text-xs font-medium text-red-700 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              Deferred Work
                            </div>
                            {deferred.sort((a, b) => (a.ordinal || 999) - (b.ordinal || 999)).map((pkg, dIdx) => (
                              <div key={dIdx} className="px-3 py-2 text-sm flex justify-between">
                                <span className="text-red-700">{pkg.title}</span>
                                <span className="text-red-600">{formatMoney(pkg.total)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================
// HELPER COMPONENTS
// ============================================

function StatCard({ icon: Icon, label, value, subtext }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        <Icon size={12} />
        {label}
      </div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      {subtext && <div className="text-xs text-gray-400">{subtext}</div>}
    </div>
  );
}

function NewVehicleForm({ data, onChange }) {
  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-sm font-medium text-blue-800 mb-3">New Vehicle Details</div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Year</label>
          <input
            type="text"
            value={data.year || ''}
            onChange={(e) => onChange({ ...data, year: e.target.value })}
            placeholder="2024"
            maxLength={4}
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Make</label>
          <input
            type="text"
            value={data.make || ''}
            onChange={(e) => onChange({ ...data, make: e.target.value })}
            placeholder="Ford"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Model</label>
          <input
            type="text"
            value={data.model || ''}
            onChange={(e) => onChange({ ...data, model: e.target.value })}
            placeholder="F-150"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">VIN (optional)</label>
          <input
            type="text"
            value={data.vin || ''}
            onChange={(e) => onChange({ ...data, vin: e.target.value.toUpperCase() })}
            placeholder="1FTEW1..."
            maxLength={17}
            className="w-full border rounded px-2 py-1.5 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Plate (optional)</label>
          <input
            type="text"
            value={data.plate || ''}
            onChange={(e) => onChange({ ...data, plate: e.target.value.toUpperCase() })}
            placeholder="ABC-1234"
            className="w-full border rounded px-2 py-1.5 text-sm font-mono"
          />
        </div>
      </div>
    </div>
  );
}

function VehicleHistoryList({ history, onAddService, addedServices }) {
  const [expandedWO, setExpandedWO] = useState(null);
  
  return (
    <div className="space-y-2">
      {history.map((wo, idx) => {
        const isExpanded = expandedWO === wo.workorder_number;
        const completed = (wo.completed_packages || []).filter(p => !p.is_header && parseFloat(p.total) > 0);
        const deferred = (wo.deferred_packages || []).filter(p => !p.is_header && parseFloat(p.total) > 0);
        
        return (
          <div key={idx} className="border border-gray-200 rounded bg-white">
            <button
              onClick={() => setExpandedWO(isExpanded ? null : wo.workorder_number)}
              className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">WO #{wo.workorder_number}</span>
                <span className="text-gray-600">{formatMoney(wo.grand_total)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <span>{formatDate(wo.invoice_date)}</span>
                {completed.length > 0 && <span className="text-green-600">{completed.length} done</span>}
                {deferred.length > 0 && <span className="text-red-500">{deferred.length} def</span>}
              </div>
            </button>
            
            {isExpanded && (
              <div className="border-t border-gray-100 text-xs">
                {completed.map((pkg, pIdx) => (
                  <ServiceLineItem 
                    key={pIdx}
                    pkg={pkg}
                    woNumber={wo.workorder_number}
                    isDeferred={false}
                    onAdd={onAddService}
                    addedServices={addedServices}
                    compact
                  />
                ))}
                {deferred.map((pkg, dIdx) => (
                  <ServiceLineItem 
                    key={dIdx}
                    pkg={pkg}
                    woNumber={wo.workorder_number}
                    isDeferred={true}
                    onAdd={onAddService}
                    addedServices={addedServices}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ServiceLineItem({ pkg, woNumber, isDeferred, onAdd, addedServices, compact = false }) {
  const isAdded = addedServices.some(s => 
    s.title === pkg.title && (s.wo_number === woNumber || s.sourceWO === woNumber)
  );
  
  const handleAdd = () => {
    if (isAdded) return;
    onAdd(
      { name: pkg.title, title: pkg.title },
      parseFloat(pkg.total) || 0,
      parseFloat(pkg.labor_hours) || 0,
      isDeferred ? 'deferred' : 'history',
      woNumber
    );
  };

  return (
    <div className={`px-3 py-2 flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} ${isDeferred ? 'bg-red-50/50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className={`${isDeferred ? 'text-gray-900' : 'text-gray-700'} truncate`}>{pkg.title}</div>
        {pkg.labor_hours && !compact && (
          <div className="text-xs text-gray-400">{pkg.labor_hours}h</div>
        )}
      </div>
      <span className={`font-medium ${isDeferred ? 'text-red-700' : 'text-gray-600'}`}>
        {formatMoney(pkg.total)}
      </span>
      <button
        onClick={handleAdd}
        disabled={isAdded}
        className={`p-1 rounded transition-colors ${
          isAdded 
            ? 'text-gray-300' 
            : isDeferred
              ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
              : 'text-green-500 hover:text-green-600 hover:bg-green-50'
        }`}
      >
        {isAdded ? <Check size={14} /> : <Plus size={14} />}
      </button>
    </div>
  );
}

export default CustomerPanel;
