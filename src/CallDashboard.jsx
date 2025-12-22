import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, MessageSquare, Search, X, Eye, EyeOff, Car, FileText, ChevronDown, ChevronUp, RefreshCw, Voicemail, CheckCircle2 } from 'lucide-react';

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

// Get the effective timestamp for a call (fallback chain)
const getCallTimestamp = (call) => {
  return call.call_created_at || call.created_at || call.last_event_at;
};

// Format a UTC timestamp to Alberta local time display
const formatTimeAlberta = (utcStr) => {
  if (!utcStr) return '';
  return new Date(utcStr).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true,
    timeZone: ALBERTA_TZ
  });
};

// Get Alberta date string (YYYY-MM-DD) from a UTC timestamp
const getAlbertaDateString = (utcStr) => {
  if (!utcStr) return '';
  const d = new Date(utcStr);
  // Format in Alberta timezone
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

// Get today's date in Alberta as YYYY-MM-DD
const getAlbertaToday = () => {
  return getAlbertaDateString(new Date().toISOString());
};

// Get yesterday's date in Alberta as YYYY-MM-DD
const getAlbertaYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getAlbertaDateString(d.toISOString());
};

// Get start of day N days ago in Alberta, returned as UTC ISO string
const getAlbertaDayStartAsUTC = (daysAgo = 0) => {
  // Get current date/time in Alberta
  const now = new Date();
  const albertaStr = now.toLocaleString('en-US', { timeZone: ALBERTA_TZ });
  const albertaNow = new Date(albertaStr);
  
  // Set to start of day and go back N days
  albertaNow.setHours(0, 0, 0, 0);
  albertaNow.setDate(albertaNow.getDate() - daysAgo);
  
  // Calculate the offset between local interpretation and actual UTC
  // We need to figure out what UTC time corresponds to midnight Alberta time
  const albertaOffset = getAlbertaOffsetMinutes(albertaNow);
  
  // Create UTC time: midnight Alberta = midnight + offset in UTC
  const utcTime = new Date(albertaNow.getTime() + (albertaOffset * 60 * 1000));
  
  return utcTime.toISOString();
};

// Get Alberta's UTC offset in minutes for a given date
const getAlbertaOffsetMinutes = (date) => {
  // Create formatter that gives us the offset
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ALBERTA_TZ,
    timeZoneName: 'shortOffset'
  });
  const parts = formatter.formatToParts(date);
  const offsetStr = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT-7';
  
  // Parse "GMT-7" or "GMT-6" 
  const match = offsetStr.match(/GMT([+-])(\d+)/);
  if (match) {
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    return sign * hours * 60;
  }
  return -7 * 60; // Default to MST
};

// ============================================
// OTHER FORMATTING UTILITIES
// ============================================
const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '-';
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
  
  // Parse YYYY-MM-DD and format nicely
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

// ============================================
// MAIN CALL DASHBOARD COMPONENT
// ============================================
export default function CallDashboard() {
  // Data state
  const [calls, setCalls] = useState([]);
  const [messages, setMessages] = useState([]);
  const [hiddenCalls, setHiddenCalls] = useState(() => {
    const saved = localStorage.getItem('hiddenCalls');
    return saved ? JSON.parse(saved) : [];
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [daysBack, setDaysBack] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('all'); // all, inbound, outbound
  const [filterOutcome, setFilterOutcome] = useState('all'); // all, answered, missed
  const [filterBusiness, setFilterBusiness] = useState('all'); // all, autopro, bwhc
  const [showHidden, setShowHidden] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [expandedCall, setExpandedCall] = useState(null);
  
  // Alberta date references
  const todayStr = getAlbertaToday();
  const yesterdayStr = getAlbertaYesterday();
  
  // ============================================
  // LOAD DATA
  // ============================================
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Calculate date range: start of day N days ago in Alberta, as UTC
      const startUTC = getAlbertaDayStartAsUTC(daysBack);
      
      // Use the enriched view - it has display_name, call_outcome, is_missed, etc.
      const callsData = await supabase.fetch('v_live_calls_enriched', {
        select: '*',
        order: 'created_at.desc', // Use created_at for ordering since it's never null
        filters: {
          'created_at': `gte.${startUTC}`,
        }
      });
      
      // Load messages for the thread view
      const messagesData = await supabase.fetch('messages', {
        select: '*',
        order: 'created_at.desc',
        filters: {
          'created_at': `gte.${startUTC}`,
        }
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
    
    // Auto-refresh every 10 seconds like the original
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);
  
  // ============================================
  // FILTER CALLS
  // ============================================
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      // Must have an external number to be useful
      if (!call.external_number) return false;
      
      // Hidden filter
      if (!showHidden && hiddenCalls.includes(call.conversation_space_id)) return false;
      if (showHidden && !hiddenCalls.includes(call.conversation_space_id)) return false;
      
      // Direction filter
      if (filterDirection === 'inbound' && call.direction?.toUpperCase() !== 'INBOUND') return false;
      if (filterDirection === 'outbound' && call.direction?.toUpperCase() !== 'OUTBOUND') return false;
      
      // Outcome filter - use is_missed from the view
      if (filterOutcome === 'answered' && call.is_missed === true) return false;
      if (filterOutcome === 'missed' && call.is_missed !== true) return false;
      
      // Business filter - check business_line_name
      if (filterBusiness !== 'all') {
        const lineName = (call.business_line_name || '').toLowerCase();
        if (filterBusiness === 'autopro' && !lineName.includes('autopro')) return false;
        if (filterBusiness === 'bwhc' && !lineName.includes('bwhc')) return false;
      }
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const phone = call.external_number || '';
        const matchesPhone = phone.toLowerCase().includes(search) || formatPhone(phone).toLowerCase().includes(search);
        const matchesName = call.display_name?.toLowerCase().includes(search);
        const matchesStaff = call.staff_name?.toLowerCase().includes(search);
        if (!matchesPhone && !matchesName && !matchesStaff) return false;
      }
      
      return true;
    });
  }, [calls, hiddenCalls, showHidden, filterDirection, filterOutcome, filterBusiness, searchTerm]);
  
  // ============================================
  // GROUP CALLS BY ALBERTA DATE
  // ============================================
  const callsByDate = useMemo(() => {
    const groups = {};
    
    filteredCalls.forEach(call => {
      const timestamp = getCallTimestamp(call);
      const dateStr = getAlbertaDateString(timestamp);
      if (!dateStr) return;
      
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(call);
    });
    
    // Sort dates descending, then sort calls within each date by time descending
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dateCalls]) => ({
        date,
        calls: dateCalls.sort((a, b) => {
          const timeA = new Date(getCallTimestamp(a)).getTime();
          const timeB = new Date(getCallTimestamp(b)).getTime();
          return timeB - timeA;
        })
      }));
  }, [filteredCalls]);
  
  // ============================================
  // STATS
  // ============================================
  const stats = useMemo(() => {
    const visible = calls.filter(c => 
      c.external_number && !hiddenCalls.includes(c.conversation_space_id)
    );
    const inbound = visible.filter(c => c.direction?.toUpperCase() === 'INBOUND');
    const outbound = visible.filter(c => c.direction?.toUpperCase() === 'OUTBOUND');
    const missed = visible.filter(c => c.is_missed === true);
    const answered = inbound.filter(c => c.is_missed !== true);
    const withWO = visible.filter(c => c.has_open_workorder);
    
    return {
      total: visible.length,
      inbound: inbound.length,
      outbound: outbound.length,
      missed: missed.length,
      answered: answered.length,
      answerRate: inbound.length > 0 ? Math.round((answered.length / inbound.length) * 100) : 0,
      withWO: withWO.length,
      hidden: calls.filter(c => hiddenCalls.includes(c.conversation_space_id)).length,
    };
  }, [calls, hiddenCalls]);
  
  // ============================================
  // CONVERSATION THREAD
  // ============================================
  const conversationThread = useMemo(() => {
    if (!selectedPhone) return [];
    
    const phoneNorm = normalizePhone(selectedPhone);
    
    // Get calls for this phone
    const phoneCalls = calls.filter(c => normalizePhone(c.external_number) === phoneNorm);
    
    // Get messages for this phone
    const phoneMessages = messages.filter(m => {
      const fromNorm = normalizePhone(m.from_number);
      const toNorm = normalizePhone(m.to_number);
      return fromNorm === phoneNorm || toNorm === phoneNorm;
    });
    
    // Combine and sort by time descending
    const combined = [
      ...phoneCalls.map(c => ({
        type: 'call',
        time: new Date(getCallTimestamp(c)),
        direction: c.direction?.toLowerCase(),
        data: c,
      })),
      ...phoneMessages.map(m => ({
        type: 'sms',
        time: new Date(m.created_at),
        direction: m.direction,
        data: m,
      }))
    ].sort((a, b) => b.time - a.time);
    
    return combined;
  }, [selectedPhone, calls, messages]);
  
  // Get customer name for selected phone
  const selectedCustomer = useMemo(() => {
    if (!selectedPhone) return null;
    const phoneNorm = normalizePhone(selectedPhone);
    const call = calls.find(c => normalizePhone(c.external_number) === phoneNorm && c.matched_customer_name);
    return call?.matched_customer_name || null;
  }, [selectedPhone, calls]);
  
  // ============================================
  // ACTIONS
  // ============================================
  const toggleHideCall = (callId) => {
    setHiddenCalls(prev => {
      const newHidden = prev.includes(callId) 
        ? prev.filter(id => id !== callId)
        : [...prev, callId];
      localStorage.setItem('hiddenCalls', JSON.stringify(newHidden));
      return newHidden;
    });
  };
  
  // ============================================
  // RENDER
  // ============================================
  if (loading && calls.length === 0) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calls...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-4 py-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {[
                { value: 1, label: 'Today' },
                { value: 3, label: '3 Days' },
                { value: 7, label: 'Week' },
              ].map(opt => (
                <button 
                  key={opt.value}
                  onClick={() => setDaysBack(opt.value)} 
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    daysBack === opt.value 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Business Filter */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {[
                { value: 'all', label: 'All' },
                { value: 'autopro', label: 'AutoPro' },
                { value: 'bwhc', label: 'BWHC' },
              ].map(opt => (
                <button 
                  key={opt.value}
                  onClick={() => setFilterBusiness(opt.value)} 
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    filterBusiness === opt.value 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 px-2 py-1 text-gray-600" title="Inbound">
                <PhoneIncoming size={14} /> {stats.inbound}
              </span>
              <span className="flex items-center gap-1 px-2 py-1 text-gray-600" title="Outbound">
                <PhoneOutgoing size={14} /> {stats.outbound}
              </span>
              <span className="flex items-center gap-1 px-2 py-1 text-gray-600" title="Answer Rate">
                <CheckCircle2 size={14} className="text-green-600" /> {stats.answerRate}%
              </span>
              <span className="flex items-center gap-1 px-2 py-1 text-gray-600" title="Missed">
                <PhoneMissed size={14} className="text-red-600" /> 
                <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{stats.missed}</span>
              </span>
              {stats.withWO > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 text-gray-600" title="With Open WO">
                  <Car size={14} /> 
                  <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{stats.withWO}</span>
                </span>
              )}
              {stats.hidden > 0 && (
                <button 
                  onClick={() => setShowHidden(!showHidden)}
                  className={`flex items-center gap-1 px-2 py-1 rounded ${showHidden ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                  title={showHidden ? 'Showing hidden' : 'Hidden calls'}
                >
                  <EyeOff size={14} /> {stats.hidden}
                </button>
              )}
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-8 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm w-40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* Direction Filter */}
            <select 
              value={filterDirection} 
              onChange={(e) => setFilterDirection(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">All Directions</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
            
            {/* Outcome Filter */}
            <select 
              value={filterOutcome} 
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">All Outcomes</option>
              <option value="answered">Answered</option>
              <option value="missed">Missed</option>
            </select>
            
            {/* Refresh */}
            <button 
              onClick={loadData}
              className={`p-1.5 hover:bg-gray-100 rounded-lg ${loading ? 'animate-spin' : ''}`}
              title="Refresh"
            >
              <RefreshCw size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Call List */}
        <div className={`${selectedPhone ? 'w-1/2' : 'w-full'} overflow-y-auto p-4`}>
          {callsByDate.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              No calls found
            </div>
          ) : (
            <div className="space-y-4">
              {callsByDate.map(({ date, calls: dateCalls }) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-sm font-semibold text-gray-700">
                      {formatDateHeader(date, todayStr, yesterdayStr)}
                    </div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <div className="text-xs text-gray-400">
                      {dateCalls.length} call{dateCalls.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {/* Calls for this date */}
                  <div className="space-y-2">
                    {dateCalls.map(call => (
                      <CallCard 
                        key={call.conversation_space_id}
                        call={call}
                        isExpanded={expandedCall === call.conversation_space_id}
                        isHidden={hiddenCalls.includes(call.conversation_space_id)}
                        isSelected={normalizePhone(call.external_number) === normalizePhone(selectedPhone)}
                        onToggleExpand={() => setExpandedCall(expandedCall === call.conversation_space_id ? null : call.conversation_space_id)}
                        onToggleHide={() => toggleHideCall(call.conversation_space_id)}
                        onSelectPhone={() => setSelectedPhone(call.external_number)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Conversation Thread Panel */}
        {selectedPhone && (
          <div className="w-1/2 border-l border-gray-200 bg-white flex flex-col">
            {/* Thread Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{formatPhone(selectedPhone)}</div>
                {selectedCustomer && <div className="text-sm text-gray-500">{selectedCustomer}</div>}
              </div>
              <button onClick={() => setSelectedPhone(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            
            {/* Thread Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversationThread.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No conversation history</p>
              ) : (
                conversationThread.map((item, idx) => (
                  <ThreadItem key={idx} item={item} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CALL CARD COMPONENT
// ============================================
function CallCard({ call, isExpanded, isHidden, isSelected, onToggleExpand, onToggleHide, onSelectPhone }) {
  const isInbound = call.direction?.toUpperCase() === 'INBOUND';
  const isMissed = call.is_missed === true;
  const callOutcome = call.call_outcome || '';
  
  const getOutcomeIcon = () => {
    if (!isInbound) return <PhoneOutgoing size={16} className="text-blue-500" />;
    if (isMissed) {
      if (call.missed_reason === 'voicemail') return <Voicemail size={16} className="text-orange-500" />;
      return <PhoneMissed size={16} className="text-red-500" />;
    }
    return <PhoneIncoming size={16} className="text-green-500" />;
  };
  
  const getOutcomeBadge = () => {
    if (!isInbound) return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Outbound</span>;
    if (isMissed) {
      if (call.missed_reason === 'voicemail') return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Voicemail</span>;
      return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Missed</span>;
    }
    return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Answered</span>;
  };
  
  // Calculate duration
  const timestamp = getCallTimestamp(call);
  const duration = call.call_ended_at && call.call_created_at 
    ? Math.round((new Date(call.call_ended_at) - new Date(call.call_created_at)) / 1000)
    : null;
  
  // Use display_name from view (already has COALESCE logic)
  const displayName = call.display_name || formatPhone(call.external_number);
  const isCustomerMatch = !!call.matched_customer_name;
  
  // Business badge
  const getBusinessBadge = () => {
    const lineName = (call.business_line_name || '').toLowerCase();
    if (lineName.includes('autopro')) {
      return <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">AP</span>;
    }
    if (lineName.includes('bwhc')) {
      return <span className="text-xs px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">BW</span>;
    }
    return null;
  };
  
  return (
    <div className={`bg-white rounded-lg border ${
      isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 
      isHidden ? 'border-gray-200 opacity-50' : 
      isMissed ? 'border-red-200' : 'border-gray-200'
    } overflow-hidden`}>
      {/* Main Row */}
      <div className="px-3 py-2 flex items-center gap-3">
        {/* Direction Icon */}
        <div className="flex-shrink-0">
          {getOutcomeIcon()}
        </div>
        
        {/* Time */}
        <div className="w-20 flex-shrink-0">
          <div className="text-sm font-medium text-gray-900">{formatTimeAlberta(timestamp)}</div>
          <div className="text-xs text-gray-400">{formatDuration(duration)}</div>
        </div>
        
        {/* Caller Info */}
        <button 
          onClick={onSelectPhone}
          className="flex-1 text-left hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 min-w-0"
        >
          <div className={`text-sm font-medium truncate ${isCustomerMatch ? 'text-green-700' : 'text-gray-700'}`}>
            {displayName}
          </div>
          {call.display_name && call.display_name !== formatPhone(call.external_number) && (
            <div className="text-xs text-gray-400 truncate">{formatPhone(call.external_number)}</div>
          )}
        </button>
        
        {/* Outcome Badge */}
        <div className="flex-shrink-0">
          {getOutcomeBadge()}
        </div>
        
        {/* Business Badge */}
        <div className="flex-shrink-0">
          {getBusinessBadge()}
        </div>
        
        {/* Staff */}
        {call.staff_name && (
          <div className="flex-shrink-0 text-sm text-gray-500 truncate max-w-24">
            {call.staff_name}
          </div>
        )}
        
        {/* Work Order Badge */}
        {call.has_open_workorder && (
          <div className="flex-shrink-0">
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
              <Car size={12} /> {call.open_wo_number}
            </span>
          </div>
        )}
        
        {/* AI Summary indicator */}
        {call.has_ai_analysis && call.ai_summary && !call.ai_summary.includes('Not enough information') && (
          <div className="flex-shrink-0" title="Has AI summary">
            <FileText size={14} className="text-purple-500" />
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleHide(); }}
            className="p-1 hover:bg-gray-100 rounded"
            title={isHidden ? "Show call" : "Hide call"}
          >
            {isHidden ? <Eye size={14} className="text-gray-400" /> : <EyeOff size={14} className="text-gray-400" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </button>
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 space-y-2">
          {/* Work Order Details */}
          {call.has_open_workorder && (
            <div className="text-sm">
              <span className="text-gray-500">Work Order:</span>
              <span className="ml-2 font-medium">{call.open_wo_number}</span>
              {call.open_wo_vehicle && <span className="ml-2 text-gray-600">• {call.open_wo_vehicle}</span>}
              {call.open_wo_total && <span className="ml-2 text-green-600">• ${parseFloat(call.open_wo_total).toFixed(2)}</span>}
              {call.open_wo_status && <span className="ml-2 text-gray-500">• {call.open_wo_status}</span>}
            </div>
          )}
          
          {/* AI Summary */}
          {call.ai_summary && !call.ai_summary.includes('Not enough information') && (
            <div className="text-sm">
              <span className="text-gray-500">Summary:</span>
              <p className="mt-1 text-gray-700 bg-white rounded p-2 border border-gray-200">{call.ai_summary}</p>
            </div>
          )}
          
          {/* AI Sentiment */}
          {call.ai_sentiment && call.ai_sentiment !== 'NEUTRAL' && (
            <div className="text-xs text-gray-500">
              Sentiment: <span className={call.ai_sentiment === 'POSITIVE' ? 'text-green-600' : 'text-red-600'}>{call.ai_sentiment}</span>
            </div>
          )}
          
          {/* Business Line */}
          {call.business_line_name && (
            <div className="text-xs text-gray-400">
              Line: {call.business_line_name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper for CallCard
const getCallTimestamp = (call) => {
  return call.call_created_at || call.created_at || call.last_event_at;
};

// ============================================
// THREAD ITEM COMPONENT
// ============================================
function ThreadItem({ item }) {
  const isInbound = item.direction === 'inbound';
  
  if (item.type === 'call') {
    const call = item.data;
    const duration = call.call_ended_at && call.call_created_at 
      ? Math.round((new Date(call.call_ended_at) - new Date(call.call_created_at)) / 1000)
      : null;
    
    const timestamp = call.call_created_at || call.created_at || call.last_event_at;
    
    return (
      <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[80%] rounded-lg p-3 ${isInbound ? 'bg-gray-100' : 'bg-blue-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Phone size={14} className={isInbound ? 'text-gray-500' : 'text-blue-500'} />
            <span className="text-xs font-medium text-gray-600">
              {isInbound ? 'Incoming Call' : 'Outgoing Call'}
            </span>
            <span className="text-xs text-gray-400">{formatDuration(duration)}</span>
          </div>
          {call.ai_summary && !call.ai_summary.includes('Not enough information') && (
            <p className="text-sm text-gray-700">{call.ai_summary}</p>
          )}
          {call.is_missed && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <PhoneMissed size={12} /> {call.missed_reason || 'Missed'}
            </p>
          )}
          {call.staff_name && (
            <p className="text-xs text-gray-500 mt-1">Handled by: {call.staff_name}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{formatTimeAlberta(timestamp)}</p>
        </div>
      </div>
    );
  }
  
  if (item.type === 'sms') {
    const msg = item.data;
    
    return (
      <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[80%] rounded-lg p-3 ${isInbound ? 'bg-gray-100' : 'bg-green-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={14} className={isInbound ? 'text-gray-500' : 'text-green-500'} />
            <span className="text-xs font-medium text-gray-600">
              {isInbound ? 'Received' : 'Sent'}
            </span>
          </div>
          <p className="text-sm text-gray-700">{msg.body}</p>
          <p className="text-xs text-gray-400 mt-1">{formatTimeAlberta(msg.created_at)}</p>
        </div>
      </div>
    );
  }
  
  return null;
}
