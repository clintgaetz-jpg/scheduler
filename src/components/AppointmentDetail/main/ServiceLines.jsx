import React, { useState, useEffect } from 'react';
import { 
  Plus, Wrench, Clock, DollarSign, CheckCircle, Pause, AlertCircle, Package, RefreshCw
} from 'lucide-react';
import ServiceLine from './ServiceLine';
import { getWorkorderLines, getWorkorderLinesByWO, linkLinesToAppointment } from '../../../utils/supabase';

// ============================================
// SERVICE LINES - Now queries workorder_lines table
// ============================================

export default function ServiceLines({ 
  appointment, 
  servicePackages, 
  technicians = [],
  onUpdateLine,
  onAddService
}) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedLines, setExpandedLines] = useState(new Set());
  
  useEffect(() => {
    if (appointment?.id) loadLines();
    else setLines([]);
  }, [appointment?.id, appointment?.workorder_number]);

  const loadLines = async () => {
    if (!appointment?.id) return;
    setLoading(true);
    setError(null);
    try {
      // Try by appointment_id first, then by workorder_number
      let data = await getWorkorderLines(appointment.id);
      if ((!data || data.length === 0) && appointment.workorder_number) {
        console.log('No lines by appt id, trying WO#:', appointment.workorder_number);
        data = await getWorkorderLinesByWO(appointment.workorder_number);
        
        // If this is the root appt (not a child), link unlinked lines to this appt
        if (data?.length > 0 && !appointment.parent_appointment_id) {
          console.log('Linking', data.length, 'lines to appointment', appointment.id);
          await linkLinesToAppointment(appointment.workorder_number, appointment.id);
          // Re-fetch by appointment_id now that they're linked
          data = await getWorkorderLines(appointment.id);
        }
      }
      setLines(data || []);
    } catch (err) {
      console.error('Failed to load workorder lines:', err);
      setError('Failed to load service lines');
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  const totals = lines.reduce((acc, line) => {
    acc.hours += parseFloat(line.labor_hours || 0);
    acc.total += parseFloat(line.line_total || 0);
    if (line.scheduler_status === 'completed') acc.doneCount++;
    if (line.scheduler_status === 'hold') acc.holdCount++;
    if (line.is_warranty_labor) acc.warrantyLaborCount++;
    acc.lineCount++;
    if (line.parts) {
      line.parts.forEach(part => {
        if (part.is_black_widow) acc.blackWidowCount++;
        else if (part.is_core) acc.coreCount++;
        else if (part.is_warranty) acc.warrantyCount++;
      });
    }
    return acc;
  }, { hours: 0, total: 0, doneCount: 0, holdCount: 0, lineCount: 0, blackWidowCount: 0, coreCount: 0, warrantyCount: 0, warrantyLaborCount: 0 });

  const toggleExpand = (lineId) => {
    setExpandedLines(prev => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const handleUpdateLine = async (lineId, updates) => {
    setLines(prev => prev.map(line => line.id === lineId ? { ...line, ...updates } : line));
    if (onUpdateLine) await onUpdateLine(lineId, updates);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Service Lines</span>
          {lines.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">{lines.length}</span>
          )}
          {totals.blackWidowCount > 0 && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded" title="Black Widow: Warranty + Core">
              🕷️ {totals.blackWidowCount}
            </span>
          )}
          {totals.coreCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded" title="Core returns">
              ⚠️ {totals.coreCount}
            </span>
          )}
          {totals.warrantyCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded" title="Warranty parts">
              🔺 {totals.warrantyCount}
            </span>
          )}
          {totals.warrantyLaborCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded" title="Warranty labor">
              🔺L {totals.warrantyLaborCount}
            </span>
          )}
          <button onClick={loadLines} disabled={loading} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Refresh lines">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button onClick={onAddService} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <Plus size={16} />Add Service
        </button>
      </div>

      {appointment?.workorder_number && (
        <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg flex items-center gap-2">
          <span>📋</span>
          <span>Work Order <strong>#{appointment.workorder_number}</strong>
            {appointment.protractor_synced_at && (
              <span className="text-gray-500 ml-2">(Synced: {new Date(appointment.protractor_synced_at).toLocaleDateString()})</span>
            )}
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} /><span>{error}</span>
          <button onClick={loadLines} className="ml-auto text-sm underline">Retry</button>
        </div>
      )}

      {loading && lines.length === 0 && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <RefreshCw size={20} className="animate-spin mr-2" />Loading service lines...
        </div>
      )}

      <div className="space-y-2">
        {!loading && lines.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Wrench size={40} className="mx-auto mb-3 text-gray-300" />
            <h4 className="font-medium text-gray-700 mb-1">{appointment?.workorder_number ? 'No Service Lines Yet' : 'No Services Scheduled'}</h4>
            <p className="text-sm text-gray-500 mb-4">{appointment?.workorder_number ? 'Lines will appear when synced from Protractor' : 'Add services to build the estimate'}</p>
            <button onClick={onAddService} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={16} />Add Service
            </button>
          </div>
        ) : (
          lines.map((line, index) => (
            <ServiceLine
              key={line.id}
              line={line}
              index={index}
              isExpanded={expandedLines.has(line.id)}
              onToggleExpand={() => toggleExpand(line.id)}
              onUpdate={(updates) => handleUpdateLine(line.id, updates)}
              servicePackages={servicePackages}
              technicians={technicians}
              appointment={appointment}
            />
          ))
        )}
      </div>

      {lines.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{totals.lineCount} service{totals.lineCount !== 1 ? 's' : ''}</span>
            {totals.doneCount > 0 && <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} />{totals.doneCount} done</span>}
            {totals.holdCount > 0 && <span className="flex items-center gap-1 text-amber-600"><Pause size={14} />{totals.holdCount} on hold</span>}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-gray-600"><Clock size={16} /><span className="font-medium">{totals.hours.toFixed(1)}h</span></div>
            <div className="flex items-center gap-1.5 text-gray-900"><DollarSign size={16} /><span className="font-bold text-lg">{totals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
