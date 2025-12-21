import React, { useState } from 'react';
import { Calendar, Phone } from 'lucide-react';
import SchedulerApp from './SchedulerApp';
import CallDashboard from './CallDashboard';

// Brand colors from NAPA AUTOPRO Graphics Guide 2023
const BRAND = {
  napaBlue: '#0A0094',
  napaYellow: '#FFC836',
  darkCharcoal: '#1a1a2e',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('scheduler');
  
  const tabs = [
    { id: 'scheduler', label: 'Scheduler', icon: Calendar },
    { id: 'calls', label: 'Calls', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Branded Header */}
      <header style={{ backgroundColor: BRAND.darkCharcoal }} className="flex-shrink-0">
        <div className="max-w-[1920px] mx-auto px-4 h-14 flex items-center justify-between">
          
          {/* Logo Text */}
          <div className="flex items-center gap-3">
            <div 
              className="px-2 py-1 font-black text-xs rounded"
              style={{ backgroundColor: BRAND.napaYellow, color: BRAND.darkCharcoal }}
            >
              NAPA
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide text-lg">AUTOPRO</span>
              <div className="h-0.5 w-10 rounded-full" style={{ backgroundColor: BRAND.napaYellow }} />
            </div>
            <div className="hidden md:block ml-3 pl-4 border-l border-gray-600">
              <span className="text-gray-300 text-sm font-medium">Sylvan Lake Autopro Inc.</span>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all duration-150
                    ${isActive ? '' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                  style={isActive ? { backgroundColor: BRAND.napaYellow, color: BRAND.darkCharcoal } : {}}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          {/* Date */}
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
        
        {/* Yellow accent line */}
        <div className="h-0.5" style={{ background: `linear-gradient(to right, ${BRAND.napaYellow}, ${BRAND.napaYellow}40, transparent)` }} />
      </header>

      {/* Tab Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'scheduler' && <SchedulerApp />}
        {activeTab === 'calls' && <CallDashboard />}
      </main>
    </div>
  );
}
