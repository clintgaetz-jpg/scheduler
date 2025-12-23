import React, { useState, useEffect } from 'react';
import { MessageSquare, FileText, RefreshCw } from 'lucide-react';

// Supabase config
const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

export default function NotesSection({ appointment }) {
  const [woNotes, setWoNotes] = useState({ advisor_notes: '', notes: '' });
  const [loading, setLoading] = useState(false);

  // Fetch notes from open_workorders when WO number changes
  useEffect(() => {
    if (!appointment?.workorder_number) {
      setWoNotes({ advisor_notes: '', notes: '' });
      return;
    }

    const fetchNotes = async () => {
      setLoading(true);
      try {
        const url = `${SUPABASE_URL}/rest/v1/open_workorders?workorder_number=eq.${appointment.workorder_number}&select=advisor_notes,notes`;
        const res = await fetch(url, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setWoNotes({
              advisor_notes: data[0].advisor_notes || '',
              notes: data[0].notes || ''
            });
          } else {
            setWoNotes({ advisor_notes: '', notes: '' });
          }
        }
      } catch (err) {
        console.error('Failed to fetch WO notes:', err);
      }
      setLoading(false);
    };

    fetchNotes();
  }, [appointment?.workorder_number]);

  // Show nothing if no WO assigned
  if (!appointment?.workorder_number) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare size={12} />
          Notes
        </h3>
        <div className="text-sm text-gray-400 italic py-2">
          Assign a W/O to view notes
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare size={12} />
          Notes
        </h3>
        {loading && <RefreshCw size={12} className="text-gray-400 animate-spin" />}
      </div>

      {/* Service Advisor Notes */}
      <div className="space-y-1">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <FileText size={10} />
          Service Advisor
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm text-gray-700 max-h-24 overflow-y-auto">
          {woNotes.advisor_notes ? (
            <div className="whitespace-pre-wrap text-xs leading-relaxed">{woNotes.advisor_notes}</div>
          ) : (
            <span className="text-gray-400 italic text-xs">No advisor notes</span>
          )}
        </div>
      </div>

      {/* General Notes */}
      <div className="space-y-1">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <MessageSquare size={10} />
          Job Notes
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm text-gray-700 max-h-24 overflow-y-auto">
          {woNotes.notes ? (
            <div className="whitespace-pre-wrap text-xs leading-relaxed">{woNotes.notes}</div>
          ) : (
            <span className="text-gray-400 italic text-xs">No job notes</span>
          )}
        </div>
      </div>
    </div>
  );
}
