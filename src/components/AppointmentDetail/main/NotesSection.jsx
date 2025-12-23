import React, { useState, useEffect } from 'react';
import { MessageSquare, FileText, Clock, Edit2, Save, ChevronDown } from 'lucide-react';

export default function NotesSection({ appointment, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(appointment?.internal_notes || '');

  useEffect(() => {
    setNotesDraft(appointment?.internal_notes || '');
  }, [appointment?.internal_notes]);

  const saveNotes = () => {
    onUpdate('internal_notes', notesDraft);
    setEditingNotes(false);
  };

  const saNotesPackage = appointment?.protractor_lines?.find(
    pkg => pkg.package_title === 'Service Advisor Notes' && pkg.chapter === 'Concern'
  );
  const combinedSANotes = saNotesPackage?.package_description || appointment?.customer_request || '';

  const formatTimestamp = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-3">
      <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center justify-between w-full">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare size={12} />Notes & Activity
        </h3>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <FileText size={12} />Job Notes
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
              {combinedSANotes || <span className="text-gray-400 italic">No job notes</span>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <MessageSquare size={12} />Internal Notes
              </div>
              {!editingNotes && (
                <button onClick={() => setEditingNotes(true)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Edit2 size={10} />Edit
                </button>
              )}
            </div>
            
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:border-blue-500 outline-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setNotesDraft(appointment?.internal_notes || ''); setEditingNotes(false); }} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs">Cancel</button>
                  <button onClick={saveNotes} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center gap-1"><Save size={10} />Save</button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-gray-700 max-h-32 overflow-y-auto cursor-pointer hover:bg-amber-100" onClick={() => setEditingNotes(true)}>
                {appointment?.internal_notes || <span className="text-gray-400 italic">Click to add notes...</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-2"><Clock size={12} />Activity</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            {appointment?.created_at && <span>Created: {formatTimestamp(appointment.created_at)}</span>}
            {appointment?.arrived_at && <span className="text-green-600">Arrived: {formatTimestamp(appointment.arrived_at)}</span>}
            {appointment?.completed_at && <span className="text-green-600">Completed: {formatTimestamp(appointment.completed_at)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
