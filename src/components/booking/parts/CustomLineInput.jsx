import React, { useState } from 'react';
import { Plus, DollarSign, Clock, Edit3 } from 'lucide-react';

// ============================================
// CustomLineInput Component
// Quick entry for custom labor lines
// ============================================

const DEFAULT_LABOR_RATE = 160;
const DEFAULT_SUPPLIES_PERCENT = 10;

export function CustomLineInput({ onAdd, laborRate = DEFAULT_LABOR_RATE, suppliesPercent = DEFAULT_SUPPLIES_PERCENT }) {
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [showPriceOverride, setShowPriceOverride] = useState(false);

  const calculatedPrice = hours 
    ? (parseFloat(hours) * laborRate * (1 + suppliesPercent / 100)).toFixed(2)
    : '0.00';

  const finalPrice = priceOverride || calculatedPrice;

  const handleAdd = () => {
    if (!description.trim() || !hours) return;
    
    onAdd(
      description.trim(),
      parseFloat(hours),
      priceOverride ? parseFloat(priceOverride) : null
    );
    
    setDescription('');
    setHours('');
    setPriceOverride('');
    setShowPriceOverride(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && description.trim() && hours) {
      handleAdd();
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
      >
        <Edit3 size={16} />
        <span className="text-sm font-medium">Add Custom Line</span>
      </button>
    );
  }

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-blue-800">Custom Labor Line</span>
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Cancel
        </button>
      </div>
      
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Description (e.g., Install mirror)"
        className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm mb-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        autoFocus
      />
      
      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label className="block text-xs text-blue-700 mb-1">Hours</label>
          <div className="relative">
            <Clock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400" />
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0.5"
              step="0.5"
              min="0.25"
              className="w-full pl-8 pr-3 py-2 border border-blue-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1">
          <label className="block text-xs text-blue-700 mb-1 flex items-center justify-between">
            <span>Price</span>
            {!showPriceOverride && hours && (
              <button 
                onClick={() => setShowPriceOverride(true)}
                className="text-blue-600 hover:underline"
              >
                Override
              </button>
            )}
          </label>
          {showPriceOverride ? (
            <div className="relative">
              <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400" />
              <input
                type="number"
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={calculatedPrice}
                step="0.01"
                min="0"
                className="w-full pl-8 pr-3 py-2 border border-blue-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          ) : (
            <div className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-700 font-medium">
              ${calculatedPrice}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-blue-600 mb-3">
        Rate: ${laborRate}/hr + {suppliesPercent}% supplies = ${(laborRate * (1 + suppliesPercent / 100)).toFixed(2)}/hr
      </div>

      <button
        onClick={handleAdd}
        disabled={!description.trim() || !hours}
        className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add ${finalPrice} · {hours || 0}h
      </button>
    </div>
  );
}

export default CustomLineInput;
