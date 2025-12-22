import React, { useState } from 'react';
import { 
  AlertTriangle, Bot, MessageSquare, ChevronDown, 
  Edit3, Save, X, FileText
} from 'lucide-react';

// ============================================
// CustomerNotesSection
// Shows shop notes, AI summary, and communication history
// ============================================

export function CustomerNotesSection({ 
  notes, 
  aiSummary, 
  communicationHistory,
  onUpdateNotes 
}) {
  const [expanded, setExpanded] = useState(!!notes); // Auto-expand if has notes
  const [editing, setEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes || '');

  const hasContent = notes || aiSummary || communicationHistory?.length > 0;

  if (!hasContent && !expanded) {
    return null; // Hide section if no content
  }

  const handleSaveNotes = () => {
    onUpdateNotes?.(editedNotes);
    setEditing(false);
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Toggle Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm hover:bg-gray-50"
      >
        <span className="flex items-center gap-2 text-gray-600 font-medium">
          <FileText size={14} />
          Notes & Info
          {notes && !expanded && (
            <span className="text-amber-600">
              <AlertTriangle size={12} />
            </span>
          )}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          
          {/* Shop Notes */}
          {(notes || editing) && (
            <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden">
              <div className="px-3 py-1.5 bg-amber-100 flex items-center justify-between">
                <span className="text-xs font-medium text-amber-800 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Shop Notes
                </span>
                {!editing && onUpdateNotes && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-amber-600 hover:text-amber-800 p-1"
                  >
                    <Edit3 size={12} />
                  </button>
                )}
              </div>
              
              {editing ? (
                <div className="p-2">
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full border border-amber-300 rounded px-2 py-1 text-sm resize-none"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setEditedNotes(notes || '');
                        setEditing(false);
                      }}
                      className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 flex items-center gap-1"
                    >
                      <Save size={10} />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-amber-900 whitespace-pre-wrap">
                  {notes}
                </div>
              )}
            </div>
          )}

          {/* AI Summary - Placeholder */}
          {aiSummary ? (
            <div className="bg-purple-50 rounded-lg border border-purple-200 overflow-hidden">
              <div className="px-3 py-1.5 bg-purple-100 flex items-center gap-1">
                <Bot size={12} className="text-purple-600" />
                <span className="text-xs font-medium text-purple-800">AI Summary</span>
              </div>
              <div className="px-3 py-2 text-sm text-purple-900">
                {aiSummary}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 border-dashed p-3 text-center">
              <Bot size={16} className="mx-auto text-gray-300 mb-1" />
              <p className="text-xs text-gray-400">AI summary coming soon</p>
            </div>
          )}

          {/* Communication History - Placeholder */}
          {communicationHistory && communicationHistory.length > 0 ? (
            <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
              <div className="px-3 py-1.5 bg-blue-100 flex items-center gap-1">
                <MessageSquare size={12} className="text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Recent Communications</span>
              </div>
              <div className="px-3 py-2 space-y-2">
                {communicationHistory.slice(0, 3).map((comm, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex items-center justify-between text-gray-500">
                      <span>{comm.type} - {comm.direction}</span>
                      <span>{comm.date}</span>
                    </div>
                    <p className="text-gray-700 truncate">{comm.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 border-dashed p-3 text-center">
              <MessageSquare size={16} className="mx-auto text-gray-300 mb-1" />
              <p className="text-xs text-gray-400">Communication history coming soon</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerNotesSection;
