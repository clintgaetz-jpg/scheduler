import React from 'react';
import { Car, Calendar, Gauge, FileText, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

// ============================================
// VehicleCard Component
// Shows a single vehicle with expandable history
// Includes estimated mileage and service intervals
// ============================================

// Helper to calculate days between dates
const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
};

// Calculate average daily km from vehicle history
const calcAvgDailyKm = (history) => {
  if (!history || history.length < 2) return 50; // Default fallback
  
  // Find visits with mileage readings
  const visitsWithMileage = history
    .filter(wo => wo.mileage || wo.odometer)
    .map(wo => ({
      date: new Date(wo.invoice_date),
      km: parseInt(wo.mileage || wo.odometer)
    }))
    .sort((a, b) => a.date - b.date);
  
  if (visitsWithMileage.length < 2) return 50;
  
  // Calculate km driven between first and last visit
  const first = visitsWithMileage[0];
  const last = visitsWithMileage[visitsWithMileage.length - 1];
  const kmDriven = last.km - first.km;
  const daysBetweenVisits = daysBetween(first.date, last.date);
  
  if (daysBetweenVisits <= 0 || kmDriven <= 0) return 50;
  
  const avgDaily = Math.round(kmDriven / daysBetweenVisits);
  // Sanity check: between 10-200 km/day
  return Math.max(10, Math.min(200, avgDaily));
};

// Helper to estimate current mileage
const estimateMileage = (lastMileage, lastDate, avgDailyKm = 50) => {
  if (!lastMileage || !lastDate) return null;
  const days = daysBetween(lastDate, new Date());
  return parseInt(lastMileage) + (days * avgDailyKm);
};

export function VehicleCard({ 
  vehicle, 
  isSelected, 
  onSelect, 
  onClick, // alias for onSelect
  compact = false,
  children // supports expandable content
}) {
  const handleClick = onClick || onSelect;
  const yearMakeModel = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
  
  // Calculate service metrics
  const lastVisitDate = vehicle.last_seen_at || vehicle.history?.[0]?.invoice_date;
  const daysSinceVisit = lastVisitDate ? daysBetween(lastVisitDate, new Date()) : null;
  const avgDailyKm = calcAvgDailyKm(vehicle.history);
  const estimatedMileage = estimateMileage(vehicle.last_mileage, lastVisitDate, avgDailyKm);
  const kmSinceVisit = estimatedMileage && vehicle.last_mileage 
    ? estimatedMileage - parseInt(vehicle.last_mileage) 
    : null;
  
  // Alert threshold: 6 months OR 8,000 km = likely due for service
  const isOverdue = (daysSinceVisit && daysSinceVisit > 180) || (kmSinceVisit && kmSinceVisit > 8000);
  
  if (compact) {
    return (
      <button
        onClick={() => handleClick(vehicle)}
        className={`w-full text-left p-2 rounded border transition-colors ${
          isSelected 
            ? 'bg-blue-50 border-blue-300' 
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <Car size={14} className="text-gray-400" />
          <span className="font-medium text-sm">{yearMakeModel || 'Unknown Vehicle'}</span>
          {isOverdue && <AlertCircle size={12} className="text-red-500" />}
        </div>
      </button>
    );
  }

  return (
    <div className={`rounded-lg border transition-all ${
      isSelected 
        ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' 
        : isOverdue
          ? 'bg-red-50 border-red-200 hover:border-red-300'
          : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      {/* Clickable header */}
      <button
        onClick={() => handleClick(vehicle)}
        className="w-full text-left p-3"
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            isSelected ? 'bg-blue-100' : isOverdue ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            <Car size={18} className={
              isSelected ? 'text-blue-600' : isOverdue ? 'text-red-500' : 'text-gray-500'
            } />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 flex items-center gap-2">
              {yearMakeModel || 'Unknown Vehicle'}
              {isOverdue && !isSelected && <span className="text-xs text-red-600 font-medium">LIKELY DUE</span>}
              {isSelected ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-gray-400" />}
            </div>
            
            {/* Row 1: Plate + Mileage */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
              {vehicle.plate && (
                <span className="flex items-center gap-1">
                  <FileText size={10} />
                  {vehicle.plate}
                </span>
              )}
              {vehicle.last_mileage && (
                <span className="flex items-center gap-1">
                  <Gauge size={10} />
                  {parseInt(vehicle.last_mileage).toLocaleString()} km
                </span>
              )}
              {estimatedMileage && (
                <span className="flex items-center gap-1 text-blue-600" title={`Estimated (~${avgDailyKm}km/day avg)`}>
                  → ~{estimatedMileage.toLocaleString()} km est
                </span>
              )}
            </div>
            
            {/* Row 2: Days/km since visit */}
            {daysSinceVisit !== null && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                <Calendar size={10} />
                {daysSinceVisit} days ago
                {kmSinceVisit && <span className="ml-1">(~{kmSinceVisit.toLocaleString()} km)</span>}
                {isOverdue && <AlertCircle size={10} className="ml-1" />}
              </div>
            )}
            
            {vehicle.history && vehicle.history.length > 0 && !isSelected && (
              <div className="mt-1 text-xs text-gray-400">
                {vehicle.history.length} service record{vehicle.history.length !== 1 ? 's' : ''} - click to expand
              </div>
            )}
          </div>
        </div>
      </button>
      
      {/* Expandable children (VehicleHistory) */}
      {isSelected && children && (
        <div className="border-t border-blue-200 p-3 bg-white rounded-b-lg">
          {children}
        </div>
      )}
    </div>
  );
}

export default VehicleCard;
