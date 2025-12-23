import React, { useState, useEffect, useMemo } from 'react';
import { X, Scissors, User, Calendar, Pause, AlertCircle, Package, ArrowRight } from 'lucide-react';
import { getWorkorderLines } from '../../../utils/supabase';

export default function SplitModal({ appointment, technicians = [], onClose, onSplit }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLines, setSelectedLines] = useState(new Set());
  const [splitType, setSplitType] = useState('tech');
  const [splitTech, setSplitTech] = useState('');
  const [splitDate, setSplitDate] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => { if (appointment?.id) loadLines(); }, [appointment?.id]);

  const loadLines = async () => {
    setLoading(true); setError(null);
    try { const data = await getWorkorderLines(appointment.id); setLines(data || []); }
    catch (err) { console.error('Failed:', err); setError('Failed to load lines'); }
    finally { setLoading(false); }
  };

  const toggleLine = (id) => setSelectedLines(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const selectAll = () => setSelectedLines(selectedLines.size === lines.length ? new Set() : new Set(lines.map(l => l.id)));

  const selectedTotals = useMemo(() => lines.filter(l => selectedLines.has(l.id)).reduce((a, l) => { a.hours += parseFloat(l.labor_hours || 0); a.total += parseFloat(l.line_total || 0); a.count++; return a; }, { hours: 0, total: 0, count: 0 }), [selectedLines, lines]);
  const remainingTotals = useMemo(() => lines.filter(l => !selectedLines.has(l.id)).reduce((a, l) => { a.hours += parseFloat(l.labor_hours || 0); a.total += parseFloat(l.line_total || 0); a.count++; return a; }, { hours: 0, total: 0, count: 0 }), [selectedLines, lines]);

  const canSplit = useMemo(() => {
    if (selectedLines.size === 0 || selectedLines.size === lines.length) return false;
    if (splitType === 'tech' && !splitTech) return false;
    if (splitType === 'date' && !splitDate) return false;
    if (splitType === 'hold' && !holdReason) return false;
    return true;
  }, [selectedLines, lines.length, splitType, splitTech, splitDate, holdReason]);

  const handleSplit = () => {
    if (!canSplit) return;
    onSplit(appointment, {
      lineIds: Array.from(selectedLines),
      lines: lines.filter(l => selectedLines.has(l.id)),
      splitType,
      splitTech: splitType === 'tech' ? splitTech : null,
      splitDate: splitType === 'date' ? splitDate : (splitType === 'tech' ? splitDate || appointment.scheduled_date : null),
      holdReason: splitType === 'hold' ? holdReason : null,
      totals: selectedTotals
    });
    onClose();
  };

  const getTechName = (id) => technicians.find(t => t.id === id)?.name || 'Unknown';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center gap-2"><Scissors className="text-purple-600" size={20} /><h2 className="text-lg font-bold text-gray-900">Split Job</h2><span className="text-sm text-gray-500">WO #{appointment?.workorder_number || 'N/A'}</span></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">{error}</div>}
          
          {!loading && !error && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-700">Select lines to split:</h3>
                  <button onClick={selectAll} className="text-sm text-blue-600 hover:text-blue-700">{selectedLines.size === lines.length ? 'Deselect All' : 'Select All'}</button>
                </div>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                  {lines.map(line => {
                    const sel = selectedLines.has(line.id);
                    const flagged = line.parts?.some(p => p.is_core || p.is_warranty || p.is_black_widow);
                    return (
                      <div key={line.id} onClick={() => toggleLine(line.id)} className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${sel ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={sel} onChange={() => {}} className="w-4 h-4 rounded border-gray-300 text-purple-600" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900 truncate">{line.title}</span>
                            {line.code && <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-mono rounded">{line.code}</span>}
                            {flagged && <span className="text-amber-500">⚠️</span>}
                          </div>
                          {line.protractor_tech_name && <div className="text-xs text-gray-400">Tech: {line.protractor_tech_name}</div>}
                        </div>
                        <div className="text-sm text-gray-500 w-12 text-right">{line.labor_hours || 0}h</div>
                        <div className="text-sm font-medium text-gray-700 w-20 text-right">${(line.line_total || 0).toFixed(2)}</div>
                        {line.parts?.length > 0 && <div className="flex items-center gap-1 text-xs text-gray-400"><Package size={12} />{line.parts.length}</div>}
                      </div>
                    );
                  })}
                  {lines.length === 0 && <div className="text-center py-8 text-gray-400">No lines to split</div>}
                </div>
              </div>
              
              {selectedLines.size > 0 && selectedLines.size < lines.length && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                  <h3 className="font-medium text-gray-700">Split destination:</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setSplitType('tech')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${splitType === 'tech' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}><User size={16} />Different Tech</button>
                    <button onClick={() => setSplitType('date')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${splitType === 'date' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}><Calendar size={16} />Different Date</button>
                    <button onClick={() => setSplitType('hold')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${splitType === 'hold' ? 'bg-amber-500 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}><Pause size={16} />Put on Hold</button>
                  </div>
                  
                  {splitType === 'tech' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Assign to:</label><select value={splitTech} onChange={(e) => setSplitTech(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"><option value="">Select tech...</option>{technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Date (optional):</label><input type="date" value={splitDate} onChange={(e) => setSplitDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                    </div>
                  )}
                  {splitType === 'date' && (
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Move to date:</label><input type="date" value={splitDate} onChange={(e) => setSplitDate(e.target.value)} className="w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm" /><p className="text-xs text-gray-500 mt-1">Same tech ({getTechName(appointment?.tech_id)}), different day</p></div>
                  )}
                  {splitType === 'hold' && (
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Hold reason:</label><select value={holdReason} onChange={(e) => setHoldReason(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"><option value="">Select reason...</option><option value="Waiting for parts">Waiting for parts</option><option value="Waiting for authorization">Waiting for authorization</option><option value="Customer requested delay">Customer requested delay</option><option value="Vehicle availability">Vehicle availability</option><option value="Tech availability">Tech availability</option><option value="Other">Other</option></select></div>
                  )}
                </div>
              )}
              
              {selectedLines.size > 0 && selectedLines.size < lines.length && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-3">Split Preview</h3>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200"><div className="text-xs text-gray-500 mb-1">Staying</div><div className="font-medium text-gray-900">{remainingTotals.count} line{remainingTotals.count !== 1 ? 's' : ''}</div><div className="text-sm text-gray-600">{remainingTotals.hours.toFixed(1)}h • ${remainingTotals.total.toFixed(2)}</div></div>
                    <ArrowRight className="text-purple-400 flex-shrink-0" size={24} />
                    <div className="flex-1 bg-purple-100 rounded-lg p-3 border border-purple-300"><div className="text-xs text-purple-600 mb-1">{splitType === 'hold' ? 'Moving to hold' : 'New child'}</div><div className="font-medium text-purple-900">{selectedTotals.count} line{selectedTotals.count !== 1 ? 's' : ''}</div><div className="text-sm text-purple-700">{selectedTotals.hours.toFixed(1)}h • ${selectedTotals.total.toFixed(2)}</div></div>
                  </div>
                </div>
              )}
              
              {selectedLines.size === 0 && lines.length > 0 && <div className="text-center text-gray-500 py-2">Select at least one line</div>}
              {selectedLines.size === lines.length && lines.length > 0 && <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg flex items-center gap-2"><AlertCircle size={16} />Can't split all lines</div>}
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-2 p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">{selectedLines.size} of {lines.length} selected</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
            <button onClick={handleSplit} disabled={!canSplit} className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${canSplit ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><Scissors size={16} />Create Split</button>
          </div>
        </div>
      </div>
    </div>
  );
}
