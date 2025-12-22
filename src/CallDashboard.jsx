import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, MessageSquare, Search, X, Eye, EyeOff, Car, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

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
  }
};

// ============================================
// ALBERTA TIMEZONE
// ============================================
const ALBERTA_TZ = 'America/Edmonton';

const getCallTimestamp = (call) => call.call_created_at || call.created_at || call.last_event_at;

const formatTimeAlberta = (utcStr) => {
  if (!utcStr) return '';
  return new Date(utcStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: ALBERTA_TZ });
};

const formatDateAlberta = (utcStr) => {
  if (!utcStr) return '';
  return new Date(utcStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: ALBERTA_TZ });
};

const getAlbertaDateString = (utcStr) => {
  if (!utcStr) return '';
  const d = new Date(utcStr);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: ALBERTA_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  return `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
};

const getAlbertaToday = () => getAlbertaDateString(new Date().toISOString());
const getAlbertaYesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return getAlbertaDateString(d.toISOString()); };

const getAlbertaDayStartAsUTC = (daysAgo = 0) => {
  const now = new Date();
  const albertaNow = new Date(now.toLocaleString('en-US', { timeZone: ALBERTA_TZ }));
  albertaNow.setHours(0, 0, 0, 0);
  albertaNow.setDate(albertaNow.getDate() - daysAgo);
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: ALBERTA_TZ, timeZoneName: 'shortOffset' });
  const offsetStr = formatter.formatToParts(albertaNow).find(p => p.type === 'timeZoneName')?.value || 'GMT-7';
  const match = offsetStr.match(/GMT([+-])(\d+)/);
  const offsetMinutes = match ? (match[1] === '+' ? 1 : -1) * parseInt(match[2], 10) * 60 : -7 * 60;
  return new Date(albertaNow.getTime() + (offsetMinutes * 60 * 1000)).toISOString();
};

// ============================================
// FORMATTING
// ============================================
const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatPhone = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '').slice(-10);
  if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  return phone;
};

const normalizePhone = (phone) => phone ? phone.replace(/[^0-9]/g, '').slice(-10) : '';

const formatDateHeader = (dateStr, todayStr, yesterdayStr) => {
  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const getBusiness = (lineName) => {
  if (!lineName) return null;
  const l = lineName.toLowerCase();
  if (l.includes('autopro')) return 'autopro';
  if (l.includes('bwhc')) return 'bwhc';
  return null;
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function CallDashboard() {
  const [calls, setCalls] = useState([]);
  const [messages, setMessages] = useState([]);
  const [hiddenCalls, setHiddenCalls] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hiddenCalls') || '[]'); } catch { return []; }
  });
  
  const [loading, setLoading] = useState(true);
  const [daysBack, setDaysBack] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterBusiness, setFilterBusiness] = useState('all');
  const [showHidden, setShowHidden] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);
  
  const todayStr = getAlbertaToday();
  const yesterdayStr = getAlbertaYesterday();
  
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const startUTC = getAlbertaDayStartAsUTC(daysBack);
      const [callsData, messagesData] = await Promise.all([
        supabase.fetch('v_live_calls_enriched', { select: '*', order: 'created_at.desc', filters: { 'created_at': `gte.${startUTC}` } }),
        supabase.fetch('messages', { select: '*', order: 'created_at.desc', filters: { 'created_at': `gte.${startUTC}` } })
      ]);
      setCalls(callsData || []);
      setMessages(messagesData || []);
    } catch (err) { console.error('Failed to load:', err); }
    setLoading(false);
  }, [daysBack]);
  
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);
  
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      if (!call.external_number) return false;
      if (!showHidden && hiddenCalls.includes(call.conversation_space_id)) return false;
      if (showHidden && !hiddenCalls.includes(call.conversation_space_id)) return false;
      
      const dir = call.direction?.toUpperCase();
      if (filterDirection === 'inbound' && dir !== 'INBOUND') return false;
      if (filterDirection === 'outbound' && dir !== 'OUTBOUND') return false;
      
      // Missed = is_missed true (includes voicemail)
      if (filterOutcome === 'answered' && call.is_missed) return false;
      if (filterOutcome === 'missed' && !call.is_missed) return false;
      
      if (filterBusiness !== 'all' && getBusiness(call.business_line_name) !== filterBusiness) return false;
      
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!(call.external_number || '').toLowerCase().includes(s) &&
            !formatPhone(call.external_number).toLowerCase().includes(s) &&
            !(call.display_name || '').toLowerCase().includes(s) &&
            !(call.staff_name || '').toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [calls, hiddenCalls, showHidden, filterDirection, filterOutcome, filterBusiness, searchTerm]);
  
  const callsByDate = useMemo(() => {
    const groups = {};
    filteredCalls.forEach(call => {
      const dateStr = getAlbertaDateString(getCallTimestamp(call));
      if (!dateStr) return;
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(call);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dateCalls]) => ({
        date,
        calls: dateCalls.sort((a, b) => new Date(getCallTimestamp(b)) - new Date(getCallTimestamp(a)))
      }));
  }, [filteredCalls]);
  
  const stats = useMemo(() => {
    const visible = calls.filter(c => c.external_number && !hiddenCalls.includes(c.conversation_space_id));
    const inbound = visible.filter(c => c.direction?.toUpperCase() === 'INBOUND');
    const missed = visible.filter(c => c.is_missed);
    const answered = inbound.filter(c => !c.is_missed);
    return {
      inbound: inbound.length,
      outbound: visible.filter(c => c.direction?.toUpperCase() === 'OUTBOUND').length,
      missed: missed.length,
      answerRate: inbound.length > 0 ? Math.round((answered.length / inbound.length) * 100) : 0,
      withWO: visible.filter(c => c.has_open_workorder).length,
      hidden: calls.filter(c => hiddenCalls.includes(c.conversation_space_id)).length,
    };
  }, [calls, hiddenCalls]);
  
  // Thread for selected call
  const selectedCall = useMemo(() => calls.find(c => c.conversation_space_id === selectedCallId), [calls, selectedCallId]);
  
  const conversationThread = useMemo(() => {
    if (!selectedCall) return [];
    const phoneNorm = normalizePhone(selectedCall.external_number);
    const phoneCalls = calls.filter(c => normalizePhone(c.external_number) === phoneNorm);
    const phoneMessages = messages.filter(m => normalizePhone(m.from_number) === phoneNorm || normalizePhone(m.to_number) === phoneNorm);
    return [
      ...phoneCalls.map(c => ({ type: 'call', time: new Date(getCallTimestamp(c)), direction: c.direction?.toLowerCase(), data: c })),
      ...phoneMessages.map(m => ({ type: 'sms', time: new Date(m.created_at), direction: m.direction, data: m }))
    ].sort((a, b) => b.time - a.time);
  }, [selectedCall, calls, messages]);
  
  const toggleHideCall = (callId) => {
    setHiddenCalls(prev => {
      const next = prev.includes(callId) ? prev.filter(id => id !== callId) : [...prev, callId];
      localStorage.setItem('hiddenCalls', JSON.stringify(next));
      return next;
    });
  };
  
  if (loading && calls.length === 0) {
    return <div className="h-full bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[{ v: 1, l: 'Today' }, { v: 3, l: '3 Days' }, { v: 7, l: 'Week' }].map(o => (
              <button key={o.v} onClick={() => setDaysBack(o.v)} className={`px-3 py-1.5 rounded text-sm font-medium ${daysBack === o.v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{o.l}</button>
            ))}
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[{ v: 'all', l: 'All' }, { v: 'autopro', l: 'AutoPro' }, { v: 'bwhc', l: 'BWHC' }].map(o => (
              <button key={o.v} onClick={() => setFilterBusiness(o.v)} className={`px-2 py-1 rounded text-xs font-medium ${filterBusiness === o.v ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>{o.l}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded"><PhoneIncoming size={14} />{stats.inbound}</span>
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded"><PhoneOutgoing size={14} />{stats.outbound}</span>
          <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded"><CheckCircle2 size={14} />{stats.answerRate}%</span>
          <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded"><PhoneMissed size={14} />{stats.missed}</span>
          {stats.withWO > 0 && <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded"><Car size={14} />{stats.withWO}</span>}
          {stats.hidden > 0 && <button onClick={() => setShowHidden(!showHidden)} className={`flex items-center gap-1 px-2 py-1 rounded ${showHidden ? 'bg-gray-300' : 'bg-gray-100 text-gray-400'}`}><EyeOff size={14} />{stats.hidden}</button>}
          
          <div className="relative ml-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-7 pr-7 py-1.5 border border-gray-200 rounded text-sm w-36" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
          </div>
          <select value={filterDirection} onChange={e => setFilterDirection(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded text-sm bg-white">
            <option value="all">All</option><option value="inbound">In</option><option value="outbound">Out</option>
          </select>
          <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded text-sm bg-white">
            <option value="all">All</option><option value="answered">Answered</option><option value="missed">Missed</option>
          </select>
          <button onClick={loadData} className={`p-1.5 hover:bg-gray-100 rounded ${loading ? 'animate-spin' : ''}`}><RefreshCw size={16} /></button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`${selectedCallId ? 'w-1/2' : 'w-full'} overflow-y-auto p-4`}>
          {callsByDate.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-500">No calls found</div>
          ) : (
            <div className="space-y-6">
              {callsByDate.map(({ date, calls: dateCalls }) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-full border shadow-sm">{formatDateHeader(date, todayStr, yesterdayStr)}</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-xs text-gray-400">{dateCalls.length}</span>
                  </div>
                  <div className="space-y-1">
                    {dateCalls.map(call => (
                      <CallRow 
                        key={call.conversation_space_id} 
                        call={call}
                        isSelected={selectedCallId === call.conversation_space_id}
                        isHidden={hiddenCalls.includes(call.conversation_space_id)}
                        onSelect={() => setSelectedCallId(selectedCallId === call.conversation_space_id ? null : call.conversation_space_id)}
                        onToggleHide={() => toggleHideCall(call.conversation_space_id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {selectedCallId && selectedCall && (
          <div className="w-1/2 border-l bg-white flex flex-col">
            <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
              <div>
                <div className="font-medium">{selectedCall.display_name || formatPhone(selectedCall.external_number)}</div>
                <div className="text-sm text-gray-500">{formatPhone(selectedCall.external_number)}</div>
              </div>
              <button onClick={() => setSelectedCallId(null)} className="p-1 hover:bg-gray-200 rounded"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversationThread.map((item, i) => <ThreadItem key={i} item={item} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CALL ROW - simple, clean, all info visible
// ============================================
function CallRow({ call, isSelected, isHidden, onSelect, onToggleHide }) {
  const isInbound = call.direction?.toUpperCase() === 'INBOUND';
  const isMissed = call.is_missed;
  const timestamp = getCallTimestamp(call);
  const durationSec = call.call_ended_at && call.call_created_at ? Math.round((new Date(call.call_ended_at) - new Date(call.call_created_at)) / 1000) : null;
  const business = getBusiness(call.business_line_name);
  
  // Who is this call with? For inbound: who called. For outbound: who we called.
  // display_name is COALESCE(matched_customer_name, caller_name, external_number)
  const contactName = call.display_name || formatPhone(call.external_number);
  const isCustomer = !!call.matched_customer_name;
  
  // Summary - show if useful
  const summary = call.ai_summary && !call.ai_summary.includes('Not enough information') ? call.ai_summary : null;
  
  // Row background
  let rowBg = 'bg-white hover:bg-gray-50';
  if (isHidden) rowBg = 'bg-gray-50 opacity-50';
  else if (isSelected) rowBg = 'bg-blue-50';
  else if (isMissed) rowBg = 'bg-red-50';
  
  return (
    <div className={`${rowBg} rounded-lg border border-gray-200 p-3 transition-colors cursor-pointer`} onClick={onSelect}>
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {!isInbound ? (
            <PhoneOutgoing size={18} className="text-blue-500" />
          ) : isMissed ? (
            <PhoneMissed size={18} className="text-red-500" />
          ) : (
            <PhoneIncoming size={18} className="text-green-500" />
          )}
        </div>
        
        {/* Time & Duration */}
        <div className="w-20 flex-shrink-0">
          <div className="text-sm font-medium">{formatTimeAlberta(timestamp)}</div>
          {durationSec != null && durationSec > 0 && (
            <div className="text-xs text-gray-400">{formatDuration(durationSec)}</div>
          )}
        </div>
        
        {/* Contact */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${isCustomer ? 'text-green-700' : 'text-gray-800'}`}>
              {isInbound ? contactName : `→ ${contactName}`}
            </span>
            {call.matched_customer_name && call.display_name !== formatPhone(call.external_number) && (
              <span className="text-xs text-gray-400">{formatPhone(call.external_number)}</span>
            )}
          </div>
          {call.business_line_name && (
            <div className="text-xs text-gray-400 truncate">on {call.business_line_name}</div>
          )}
        </div>
        
        {/* Badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isInbound && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Out</span>}
          {isInbound && isMissed && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Missed</span>}
          {isInbound && !isMissed && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Answered</span>}
          
          {business === 'autopro' && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">AP</span>}
          {business === 'bwhc' && <span className="text-xs px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">BW</span>}
        </div>
        
        {/* Staff */}
        {call.staff_name && (
          <div className="text-sm text-gray-500 flex-shrink-0 max-w-24 truncate">{call.staff_name}</div>
        )}
        
        {/* Work Order */}
        {call.has_open_workorder && (
          <div className="flex-shrink-0">
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
              <Car size={12} />
              {call.open_wo_number}
              {call.open_wo_vehicle && <span className="hidden sm:inline">• {call.open_wo_vehicle}</span>}
              {call.open_wo_total && <span className="text-green-700 font-medium">${Number(call.open_wo_total).toLocaleString()}</span>}
            </span>
          </div>
        )}
        
        {/* Hide button */}
        <button onClick={e => { e.stopPropagation(); onToggleHide(); }} className="p-1 hover:bg-gray-200 rounded flex-shrink-0">
          {isHidden ? <Eye size={14} className="text-gray-400" /> : <EyeOff size={14} className="text-gray-400" />}
        </button>
      </div>
      
      {/* Summary - always visible if present */}
      {summary && (
        <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded px-2 py-1.5 border-l-2 border-gray-300">
          {summary}
        </div>
      )}
    </div>
  );
}

// ============================================
// THREAD ITEM
// ============================================
function ThreadItem({ item }) {
  const isInbound = item.direction === 'inbound';
  
  if (item.type === 'call') {
    const call = item.data;
    const duration = call.call_ended_at && call.call_created_at ? Math.round((new Date(call.call_ended_at) - new Date(call.call_created_at)) / 1000) : null;
    const ts = call.call_created_at || call.created_at || call.last_event_at;
    const summary = call.ai_summary && !call.ai_summary.includes('Not enough information') ? call.ai_summary : null;
    
    return (
      <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[85%] rounded-lg p-3 ${isInbound ? 'bg-gray-100' : 'bg-blue-100'}`}>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Phone size={12} />
            <span className="font-medium">{isInbound ? 'Incoming' : 'Outgoing'}</span>
            {duration != null && <span>{formatDuration(duration)}</span>}
            {call.is_missed && <span className="text-red-600">• Missed</span>}
          </div>
          {summary && <p className="text-sm text-gray-700">{summary}</p>}
          {call.staff_name && <p className="text-xs text-gray-500 mt-1">→ {call.staff_name}</p>}
          <p className="text-xs text-gray-400 mt-1">{formatTimeAlberta(ts)} • {formatDateAlberta(ts)}</p>
        </div>
      </div>
    );
  }
  
  if (item.type === 'sms') {
    const msg = item.data;
    return (
      <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[85%] rounded-lg p-3 ${isInbound ? 'bg-gray-100' : 'bg-green-100'}`}>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <MessageSquare size={12} />
            <span className="font-medium">{isInbound ? 'Received' : 'Sent'}</span>
          </div>
          <p className="text-sm text-gray-700">{msg.body}</p>
          <p className="text-xs text-gray-400 mt-1">{formatTimeAlberta(msg.created_at)} • {formatDateAlberta(msg.created_at)}</p>
        </div>
      </div>
    );
  }
  return null;
}
