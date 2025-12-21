import React, { useState, useEffect, useMemo } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, MessageSquare, ChevronLeft, ChevronRight, Search, X, Eye, EyeOff, Clock, User, Car, DollarSign, FileText, ChevronDown, ChevronUp, RefreshCw, Filter, Calendar, ArrowUpDown, Voicemail, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

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
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDuration = (seconds) => {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
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

const getDateRange = (daysBack) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  return { start: start.toISOString(), end: end.toISOString() };
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysBack, setDaysBack] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('all'); // all, inbound, outbound
  const [filterOutcome, setFilterOutcome] = useState('all'); // all, answered, missed
  const [showHidden, setShowHidden] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [expandedCall, setExpandedCall] = useState(null);
  
  // ============================================
  // LOAD DATA
  // ============================================
  useEffect(() => {
    loadData();
  }, [daysBack]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const range = getDateRange(daysBack);
      
      // Load calls
      const callsData = await supabase.fetch('Live_Call', {
        select: '*',
        order: 'call_created_at.desc',
        filters: {
          'call_created_at': `gte.${range.start}`,
        }
      });
      
      // Load messages
      const messagesData = await supabase.fetch('messages', {
        select: '*',
        order: 'created_at.desc',
        filters: {
          'created_at': `gte.${range.start}`,
        }
      });
      
      setCalls(callsData || []);
      setMessages(messagesData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setLoading(false);
  };
  
  // ============================================
  // FILTER & PROCESS CALLS
  // ============================================
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      // Filter out internal extensions
      const phone = call.external_number || '';
      if (phone.length < 10 && !phone.startsWith('+')) return false;
      
      // Hidden filter
      if (!showHidden && hiddenCalls.includes(call.conversation_space_id)) return false;
      if (showHidden && !hiddenCalls.includes(call.conversation_space_id)) return false;
      
      // Direction filter
      if (filterDirection !== 'all' && call.direction?.toLowerCase() !== filterDirection) return false;
      
      // Outcome filter
      if (filterOutcome === 'answered' && call.is_missed) return false;
      if (filterOutcome === 'missed' && !call.is_missed) return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesPhone = phone.includes(search);
        const matchesName = call.matched_customer_name?.toLowerCase().includes(search);
        const matchesStaff = call.staff_name?.toLowerCase().includes(search);
        if (!matchesPhone && !matchesName && !matchesStaff) return false;
      }
      
      return true;
    });
  }, [calls, hiddenCalls, showHidden, filterDirection, filterOutcome, searchTerm]);
  
  // ============================================
  // STATS
  // ============================================
  const stats = useMemo(() => {
    const visible = calls.filter(c => !hiddenCalls.includes(c.conversation_space_id));
    const inbound = visible.filter(c => c.direction?.toLowerCase() === 'inbound');
    const outbound = visible.filter(c => c.direction?.toLowerCase() === 'outbound');
    const missed = inbound.filter(c => c.is_missed);
    const answered = inbound.filter(c => !c.is_missed);
    const withWO = visible.filter(c => c.open_wo_number);
    
    return {
      total: visible.length,
      inbound: inbound.length,
      outbound: outbound.length,
      missed: missed.length,
      answered: answered.length,
      answerRate: inbound.length > 0 ? Math.round((answered.length / inbound.length) * 100) : 0,
      withWO: withWO.length,
      hidden: hiddenCalls.length,
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
    
    // Combine and sort by time
    const combined = [
      ...phoneCalls.map(c => ({
        type: 'call',
        time: new Date(c.call_created_at),
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
  
  const navigateDay = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d.toISOString().split('T')[0]);
  };
  
  // ============================================
  // RENDER
  // ============================================
  if (loading) {
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
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {[1, 3, 7].map(d => (
                <button 
                  key={d}
                  onClick={() => setDaysBack(d)} 
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${daysBack === d ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {d === 1 ? 'Today' : `${d} Days`}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 px-2 py-1 text-gray-600">
                <PhoneIncoming size={14} /> {stats.inbound}
              </span>
              <span className="flex items-center gap-1 px-2 py-1 text-gray-600">
                <PhoneOutgoing size={14} /> {stats.outbound}
              </span>
              <span className="flex items-center gap-1 px-2 py-1 text-gray-600">
                <CheckCircle2 size={14} className="text-green-600" /> {stats.answerRate}%
              </span>
              <span className="flex items-center gap-1 px-2 py-1 text-gray-600">
                <PhoneMissed size={14} className="text-red-600" /> 
                <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{stats.missed}</span>
              </span>
              <span className="flex items-center gap-1 px-2 py-1 text-gray-600">
                <Car size={14} /> 
                <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{stats.withWO}</span>
              </span>
              {stats.hidden > 0 && (
                <button 
                  onClick={() => setShowHidden(!showHidden)}
                  className={`flex items-center gap-1 px-2 py-1 rounded ${showHidden ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
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
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm w-40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
              />
            </div>
            
            {/* Filters */}
            <select 
              value={filterDirection} 
              onChange={(e) => setFilterDirection(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Directions</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
            
            <select 
              value={filterOutcome} 
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Outcomes</option>
              <option value="answered">Answered</option>
              <option value="missed">Missed</option>
            </select>
            
            {/* Refresh */}
            <button 
              onClick={loadData}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content - fills remaining space */}
      <div className="flex-1 flex overflow-hidden">
        {/* Call List */}
        <div className={`${selectedPhone ? 'w-1/2' : 'w-full'} overflow-y-auto p-4`}>
          <div className="space-y-2">
            {filteredCalls.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                No calls found
              </div>
            ) : (
              filteredCalls.map(call => (
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
              ))
            )}
          </div>
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
  const isInbound = call.direction?.toLowerCase() === 'inbound';
  const isMissed = call.is_missed;
  
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
  
  const duration = call.call_ended_at && call.call_created_at 
    ? Math.round((new Date(call.call_ended_at) - new Date(call.call_created_at)) / 1000)
    : null;
  
  return (
    <div className={`bg-white rounded-lg border ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : isHidden ? 'border-gray-200 opacity-50' : isMissed ? 'border-red-200' : 'border-gray-200'} overflow-hidden`}>
      {/* Main Row */}
      <div className="px-3 py-2 flex items-center gap-3">
        {/* Direction Icon */}
        <div className="flex-shrink-0">
          {getOutcomeIcon()}
        </div>
        
        {/* Time */}
        <div className="w-20 flex-shrink-0">
          <div className="text-sm font-medium text-gray-900">{formatTime(call.call_created_at)}</div>
          <div className="text-xs text-gray-400">{formatDuration(duration)}</div>
        </div>
        
        {/* Caller Info */}
        <button 
          onClick={onSelectPhone}
          className="flex-1 text-left hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1"
        >
          <div className={`text-sm font-medium ${call.matched_customer_name ? 'text-green-700' : 'text-gray-700'}`}>
            {call.matched_customer_name || formatPhone(call.external_number)}
          </div>
          {call.matched_customer_name && (
            <div className="text-xs text-gray-400">{formatPhone(call.external_number)}</div>
          )}
        </button>
        
        {/* Outcome Badge */}
        <div className="flex-shrink-0">
          {getOutcomeBadge()}
        </div>
        
        {/* Staff */}
        {call.staff_name && (
          <div className="flex-shrink-0 text-sm text-gray-500">
            {call.staff_name}
          </div>
        )}
        
        {/* Work Order Badge */}
        {call.open_wo_number && (
          <div className="flex-shrink-0">
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
              <Car size={12} /> WO# {call.open_wo_number}
            </span>
          </div>
        )}
        
        {/* AI Summary indicator */}
        {call.ai_summary && (
          <div className="flex-shrink-0">
            <FileText size={14} className="text-purple-500" />
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            onClick={onToggleHide}
            className="p-1 hover:bg-gray-100 rounded"
            title={isHidden ? "Show call" : "Hide call"}
          >
            {isHidden ? <Eye size={14} className="text-gray-400" /> : <EyeOff size={14} className="text-gray-400" />}
          </button>
          <button 
            onClick={onToggleExpand}
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
          {call.open_wo_number && (
            <div className="text-sm">
              <span className="text-gray-500">Work Order:</span>
              <span className="ml-2 font-medium">{call.open_wo_number}</span>
              {call.open_wo_vehicle && <span className="ml-2 text-gray-600">• {call.open_wo_vehicle}</span>}
              {call.open_wo_total && <span className="ml-2 text-green-600">• ${parseFloat(call.open_wo_total).toFixed(2)}</span>}
            </div>
          )}
          
          {/* AI Summary */}
          {call.ai_summary && (
            <div className="text-sm">
              <span className="text-gray-500">Summary:</span>
              <p className="mt-1 text-gray-700 bg-white rounded p-2 border border-gray-200">{call.ai_summary}</p>
            </div>
          )}
          
          {/* Business */}
          {call.business && (
            <div className="text-xs text-gray-400">
              Business: {call.business}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
          {call.ai_summary && (
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
          <p className="text-xs text-gray-400 mt-1">{formatTime(call.call_created_at)} • {formatDateShort(call.call_created_at)}</p>
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
          <p className="text-xs text-gray-400 mt-1">{formatTime(msg.created_at)} • {formatDateShort(msg.created_at)}</p>
        </div>
      </div>
    );
  }
  
  return null;
}
