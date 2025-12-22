import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, MessageSquare, Search, X, Eye, EyeOff, Car, ChevronDown, ChevronUp, RefreshCw, Voicemail, CheckCircle2, Clock } from 'lucide-react';

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
// ALBERTA TIMEZONE UTILITIES
// ============================================
const ALBERTA_TZ = 'America/Edmonton';

const getCallTimestamp = (call) => {
  return call.call_created_at || call.created_at || call.last_event_at;
};

const formatTimeAlberta = (utcStr) => {
  if (!utcStr) return '';
  return new Date(utcStr).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true,
    timeZone: ALBERTA_TZ
  });
};

const formatDateAlberta = (utcStr) => {
  if (!utcStr) return '';
  return new Date(utcStr).toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    timeZone: ALBERTA_TZ
  });
};

const getAlbertaDateString = (utcStr) => {
  if (!utcStr) return '';
  const d = new Date(utcStr);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ALBERTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d);
  
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

const getAlbertaToday = () => getAlbertaDateString(new Date().toISOString());

const getAlbertaYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getAlbertaDateString(d.toISOString());
};

const getAlbertaDayStartAsUTC = (daysAgo = 0) => {
  const now = new Date();
  const albertaStr = now.toLocaleString('en-US', { timeZone: ALBERTA_TZ });
  const albertaNow = new Date(albertaStr);
  albertaNow.setHours(0, 0, 0, 0);
  albertaNow.setDate(albertaNow.getDate() - daysAgo);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ALBERTA_TZ,
    timeZoneName: 'shortOffset'
  });
  const parts = formatter.formatToParts(albertaNow);
  const offsetStr = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT-7';
  const match = offsetStr.match(/GMT([+-])(\d+)/);
  const offsetMinutes = match ? (match[1] === '+' ? 1 : -1) * parseInt(match[2], 10) * 60 : -7 * 60;
  
  const utcTime = new Date(albertaNow.getTime() + (offsetMinutes * 60 * 1000));
  return utcTime.toISOString();
};

// ============================================
// FORMATTING UTILITIES
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
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  return phone;
};

const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-10);
};

const formatDateHeader = (dateStr, todayStr, yesterdayStr) => {
  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const getBusiness = (lineName) => {
  if (!lineName) return null;
  const lower = lineName.toLowerCase();
  if (lower.includes('autopro')) return 'autopro';
  if (lower.includes('bwhc')) return 'bwhc';
  return null;
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function CallDashboard() {
  const [calls, setCalls] = useState([]);
  const [messages, setMessages] = useState([]);
  const [hiddenCalls, setHiddenCalls] = useState(() => {
    const saved = localStorage.getItem('hiddenCalls');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [loading, setLoading] = useState(true);
  const [daysBack, setDaysBack] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterBusiness, setFilterBusiness] = useState('all');
  const [showHidden, setShowHidden] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [expandedCall, setExpandedCall] = useState(null);
  
  const todayStr = getAlbertaToday();
  const yesterdayStr = getAlbertaYesterday();
  
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const startUTC = getAlbertaDayStartAsUTC(daysBack);
      
      const callsData = await supabase.fetch('v_live_calls_enriched', {
        select: '*',
        order: 'created_at.desc',
        filters: { 'created_at': `gte.${startUTC}` }
      });
      
      const messagesData = await supabase.fetch('messages', {
        select: '*',
        order: 'created_at.desc',
        filters: { 'created_at': `gte.${startUTC}` }
      });
      
      setCalls(callsData || []);
      setMessages(messagesData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
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
      if (filterDirection === 'inbound' && call.direction?.toUpperCase() !== 'INBOUND') return false;
      if (filterDirection === 'outbound' && call.direction?.toUpperCase() !== 'OUTBOUND') return false;
      if (filterOutcome === 'answered' && call.is_missed === true) return false;
      if (filterOutcome === 'missed' && call.is_missed !== true) return false;
      if (filterBusiness !== 'all' && getBusiness(call.business_line_name) !== filterBusiness) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesPhone = (call.external_number || '').toLowerCase().includes(search) || formatPhone(call.external_number).toLowerCase().includes(search);
        const matchesName = call.display_name?.toLowerCase().includes(search);
        const matchesStaff = call.staff_name?.toLowerCase().includes(search);
        if (!matchesPhone && !matchesName && !matchesStaff) return false;
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
        calls: dateCalls.sort((a, b) => new Date(getCallTimestamp(b)).getTime() - new Date(getCallTimestamp(a)).getTime())
      }));
  }, [filteredCalls]);
  
  const stats = useMemo(() => {
    const visible = calls.filter(c => c.external_number && !hiddenCalls.includes(c.conversation_space_id));
    const inbound = visible.filter(c => c.direction?.toUpperCase() === 'INBOUND');
    const missed = visible.filter(c => c.is_missed === true);
    const answered = inbound.filter(c => c.is_missed !== true);
    return {
      inbound: inbound.length,
      outbound: visible.filter(c => c.direction?.toUpperCase() === 'OUTBOUND').length,
      missed: missed.length,
      answerRate: inbound.length > 0 ? Math.round((answered.length / inbound.length) * 100) : 0,
      withWO: visible.filter(c => c.has_open_workorder).length,
      hidden: calls.filter(c => hiddenCalls.includes(c.conversation_space_id)).length,
    };
  }, [calls, hiddenCalls]);
  
  const conversationThread = useMemo(() => {
    if (!selectedPhone) return [];
    const phoneNorm = normalizePhone(selectedPhone);
    const phoneCalls = calls.filter(c => normalizePhone(c.external_number) === phoneNorm);
    const phoneMessages = messages.filter(m => normalizePhone(m.from_number) === phoneNorm || normalizePhone(m.to_number) === phoneNorm);
    return [
      ...phoneCalls.map(c => ({ type: 'call', time: new Date(getCallTimestamp(c)), direction: c.direction?.toLowerCase(), data: c })),
      ...phoneMessages.map(m => ({ type: 'sms', time: new Date(m.created_at), direction: m.direction, data: m }))
    ].sort((a, b) => b.time - a.time);
  }, [selectedPhone, calls, messages]);
  
  const selectedCustomer = useMemo(() => {
    if (!selectedPhone) return null;
    const call = calls.find(c => normalizePhone(c.external_number) === normalizePhone(selectedPhone) && c.matched_customer_name);
    return call?.matched_customer_name || null;
  }, [selectedPhone, calls]);
  
  const toggleHideCall = (callId) => {
    setHiddenCalls(prev => {
      const newHidden = prev.includes(callId) ? prev.filter(id => id !== callId) : [...prev, callId];
      localStorage.setItem('hiddenCalls', JSON.stringify(newHidden));
      return newHidden;
    });
  };
  
  if (loading && calls.length === 0) {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0 px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-1">
              {[{ value: 1, label: 'Today' }, { value: 3, label: '3 Days' }, { value: 7, label: 'Week' }].map(opt => (
                <button key={opt.value} onClick={() => setDaysBack(opt.value)} 
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${daysBack === opt.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex bg-slate-100 rounded-lg p-1">
              {[{ value: 'all', label: 'All' }, { value: 'autopro', label: 'AutoPro', c: 'text-violet-700' }, { value: 'bwhc', label: 'BWHC', c: 'text-teal-700' }].map(opt => (
                <button key={opt.value} onClick={() => setFilterBusiness(opt.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filterBusiness === opt.value ? `bg-white shadow-sm ${opt.c || 'text-slate-900'}` : 'text-slate-500 hover:text-slate-700'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100"><PhoneIncoming size={14} className="text-slate-500" /><span className="font-medium">{stats.inbound}</span></div>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100"><PhoneOutgoing size={14} className="text-slate-500" /><span className="font-medium">{stats.outbound}</span></div>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-50"><CheckCircle2 size={14} className="text-green-600" /><span className="font-medium text-green-700">{stats.answerRate}%</span></div>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-50"><PhoneMissed size={14} className="text-red-500" /><span className="font-medium text-red-700">{stats.missed}</span></div>
              {stats.withWO > 0 && <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50"><Car size={14} className="text-amber-600" /><span className="font-medium text-amber-700">{stats.withWO}</span></div>}
              {stats.hidden > 0 && <button onClick={() => setShowHidden(!showHidden)} className={`flex items-center gap-1 px-2 py-1 rounded ${showHidden ? 'bg-slate-200' : 'bg-slate-100 text-slate-400'}`}><EyeOff size={14} /><span className="font-medium">{stats.hidden}</span></button>}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-8 py-1.5 border border-slate-200 rounded-lg text-sm w-44 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
            </div>
            <select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="all">All</option><option value="inbound">Inbound</option><option value="outbound">Outbound</option>
            </select>
            <select value={filterOutcome} onChange={(e) => setFilterOutcome(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="all">All</option><option value="answered">Answered</option><option value="missed">Missed</option>
            </select>
            <button onClick={loadData} className={`p-2 hover:bg-slate-100 rounded-lg ${loading ? 'animate-spin' : ''}`}><RefreshCw size={16} className="text-slate-600" /></button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`${selectedPhone ? 'w-1/2' : 'w-full'} overflow-y-auto p-4`}>
          {callsByDate.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm">No calls found</div>
          ) : (
            <div className="space-y-6">
              {callsByDate.map(({ date, calls: dateCalls }) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-sm font-bold text-slate-800 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">{formatDateHeader(date, todayStr, yesterdayStr)}</div>
                    <div className="flex-1 h-px bg-slate-200"></div>
                    <div className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{dateCalls.length}</div>
                  </div>
                  <div className="space-y-2">
                    {dateCalls.map(call => (
                      <CallCard key={call.conversation_space_id} call={call}
                        isExpanded={expandedCall === call.conversation_space_id}
                        isHidden={hiddenCalls.includes(call.conversation_space_id)}
                        isSelected={normalizePhone(call.external_number) === normalizePhone(selectedPhone)}
                        onToggleExpand={() => setExpandedCall(expandedCall === call.conversation_space_id ? null : call.conversation_space_id)}
                        onToggleHide={() => toggleHideCall(call.conversation_space_id)}
                        onSelectPhone={() => setSelectedPhone(call.external_number)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {selectedPhone && (
          <div className="w-1/2 border-l border-slate-200 bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="font-semibold text-slate-900">{formatPhone(selectedPhone)}</div>
                {selectedCustomer && <div className="text-sm text-green-600 font-medium">{selectedCustomer}</div>}
              </div>
              <button onClick={() => setSelectedPhone(null)} className="p-1.5 hover:bg-slate-200 rounded-lg"><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversationThread.length === 0 ? <p className="text-center text-slate-400 py-8">No history</p> : conversationThread.map((item, idx) => <ThreadItem key={idx} item={item} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CALL CARD
// ============================================
function CallCard({ call, isExpanded, isHidden, isSelected, onToggleExpand, onToggleHide, onSelectPhone }) {
  const isInbound = call.direction?.toUpperCase() === 'INBOUND';
  const isMissed = call.is_missed === true;
  const timestamp = getCallTimestamp(call);
  const business = getBusiness(call.business_line_name);
  const durationSec = call.call_ended_at && call.call_created_at ? Math.round((new Date(call.call_ended_at) - new Date(call.call_created_at)) / 1000) : null;
  const isLikelyAbandoned = isMissed && call.missed_reason === 'voicemail' && durationSec && durationSec < 10;
  const displayName = call.display_name || formatPhone(call.external_number);
  const isCustomerMatch = !!call.matched_customer_name;
  const hasSummary = call.ai_summary && !call.ai_summary.includes('Not enough information');
  
  const cardStyle = isHidden ? 'bg-slate-50 border-slate-200 opacity-60' : isSelected ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' : isMissed ? 'bg-red-50/50 border-red-200' : !isInbound ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300';
  const accentStyle = isMissed ? 'border-l-4 border-l-red-400' : !isInbound ? 'border-l-4 border-l-blue-400' : call.has_open_workorder ? 'border-l-4 border-l-amber-400' : isCustomerMatch ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-transparent';

  return (
    <div className={`rounded-lg border shadow-sm transition-all ${cardStyle} ${accentStyle}`}>
      <div className="px-3 py-2.5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {!isInbound ? (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><PhoneOutgoing size={16} className="text-blue-600" /></div>
            ) : isMissed ? (
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                {isLikelyAbandoned || call.missed_reason !== 'voicemail' ? <PhoneMissed size={16} className="text-red-500" /> : <Voicemail size={16} className="text-orange-500" />}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><PhoneIncoming size={16} className="text-green-600" /></div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={onSelectPhone} className={`font-semibold text-sm hover:underline ${isCustomerMatch ? 'text-green-700' : 'text-slate-800'}`}>{displayName}</button>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">{formatTimeAlberta(timestamp)}</span>
              {durationSec != null && durationSec > 0 && (<><span className="text-xs text-slate-400">•</span><span className="text-xs text-slate-400 flex items-center gap-0.5"><Clock size={10} />{formatDuration(durationSec)}</span></>)}
              
              {!isInbound ? <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Out</span>
               : isMissed ? <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">{isLikelyAbandoned ? 'Abandoned' : call.missed_reason === 'voicemail' ? 'Voicemail' : 'Missed'}</span>
               : <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Answered</span>}
              
              {business === 'autopro' && <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-medium">AutoPro</span>}
              {business === 'bwhc' && <span className="text-xs px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 font-medium">BWHC</span>}
              {call.staff_name && <span className="text-xs text-slate-500">→ {call.staff_name}</span>}
            </div>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
              {call.display_name && call.display_name !== formatPhone(call.external_number) && <span className="text-slate-400">{formatPhone(call.external_number)}</span>}
              {call.business_line_name && <span className="text-slate-400">on {call.business_line_name}</span>}
              {call.has_open_workorder && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                  <Car size={12} />WO# {call.open_wo_number}{call.open_wo_vehicle && ` • ${call.open_wo_vehicle}`}
                  {call.open_wo_total && <span className="text-green-700 font-semibold ml-1">${parseFloat(call.open_wo_total).toLocaleString()}</span>}
                </span>
              )}
            </div>
            
            {hasSummary && <p className="mt-2 text-sm text-slate-600 leading-snug bg-slate-50 rounded px-2 py-1.5 border-l-2 border-slate-300">{call.ai_summary}</p>}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onToggleHide(); }} className="p-1.5 hover:bg-slate-100 rounded-lg" title={isHidden ? "Show" : "Hide"}>
              {isHidden ? <Eye size={14} className="text-slate-400" /> : <EyeOff size={14} className="text-slate-400" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} className="p-1.5 hover:bg-slate-100 rounded-lg">
              {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50 text-xs space-y-1">
          {call.ai_sentiment && call.ai_sentiment !== 'NEUTRAL' && <div><span className="text-slate-500">Sentiment:</span> <span className={call.ai_sentiment === 'POSITIVE' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{call.ai_sentiment}</span></div>}
          {call.ai_topics?.length > 0 && <div><span className="text-slate-500">Topics:</span> <span className="text-slate-700">{call.ai_topics.join(', ')}</span></div>}
          {call.has_recording && <div className="text-slate-500">📼 Recording available</div>}
          <div className="text-slate-400">ID: {call.conversation_space_id}</div>
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
    const timestamp = call.call_created_at || call.created_at || call.last_event_at;
    const hasSummary = call.ai_summary && !call.ai_summary.includes('Not enough information');
    
    return (
      <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[85%] rounded-xl p-3 shadow-sm ${isInbound ? 'bg-slate-100' : 'bg-blue-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Phone size={14} className={isInbound ? 'text-slate-500' : 'text-blue-600'} />
            <span className="text-xs font-semibold text-slate-600">{isInbound ? 'Incoming' : 'Outgoing'}</span>
            {duration != null && <span className="text-xs text-slate-400">{formatDuration(duration)}</span>}
          </div>
          {hasSummary && <p className="text-sm text-slate-700 mb-1">{call.ai_summary}</p>}
          {call.is_missed && <p className="text-sm text-red-600 flex items-center gap-1"><PhoneMissed size={12} /> {call.missed_reason || 'Missed'}</p>}
          {call.staff_name && <p className="text-xs text-slate-500">→ {call.staff_name}</p>}
          <p className="text-xs text-slate-400 mt-1">{formatTimeAlberta(timestamp)} • {formatDateAlberta(timestamp)}</p>
        </div>
      </div>
    );
  }
  
  if (item.type === 'sms') {
    const msg = item.data;
    return (
      <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[85%] rounded-xl p-3 shadow-sm ${isInbound ? 'bg-slate-100' : 'bg-green-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={14} className={isInbound ? 'text-slate-500' : 'text-green-600'} />
            <span className="text-xs font-semibold text-slate-600">{isInbound ? 'Received' : 'Sent'}</span>
          </div>
          <p className="text-sm text-slate-700">{msg.body}</p>
          <p className="text-xs text-slate-400 mt-1">{formatTimeAlberta(msg.created_at)} • {formatDateAlberta(msg.created_at)}</p>
        </div>
      </div>
    );
  }
  return null;
}
