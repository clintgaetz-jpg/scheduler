import { useState, useMemo, useCallback } from 'react';
import { getBookingHours, SHOP_SUPPLY_RATE, GST_RATE } from '../utils/constants';

// ============================================
// useQuote Hook
// Manages quote services, calculates totals
// ============================================

export function useQuote(settings = {}) {
  const [services, setServices] = useState([]);

  // Add a service to the quote
  const addService = useCallback((pkg, price = null, hours = null, source = 'package', woNumber = null) => {
    const newService = {
      id: Date.now() + Math.random(), // Unique ID
      package_id: pkg.id || null,
      name: pkg.name || pkg.title,
      price: price ?? pkg.default_price ?? pkg.total ?? 0,
      hours: hours ?? pkg.default_hours ?? getBookingHours(pkg),
      source, // 'package', 'history', 'deferred'
      sourceWO: woNumber,
      // Keep original data for reference
      labor_total: pkg.labor_total,
      parts_total: pkg.parts_total,
      labor_hours: pkg.labor_hours,
    };
    
    setServices(prev => [...prev, newService]);
    return newService;
  }, []);

  // Remove a service
  const removeService = useCallback((id) => {
    setServices(prev => prev.filter(s => s.id !== id));
  }, []);

  // Update a service
  const updateService = useCallback((id, updates) => {
    setServices(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  }, []);

  // Clear all services
  const clearServices = useCallback(() => {
    setServices([]);
  }, []);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
    const hours = services.reduce((sum, s) => sum + (parseFloat(s.hours) || 0), 0);
    
    // Labor total (for shop supply calc)
    const laborTotal = services.reduce((sum, s) => {
      if (s.labor_total) return sum + parseFloat(s.labor_total);
      // Estimate 40% of price is labor
      return sum + (parseFloat(s.price) || 0) * 0.4;
    }, 0);
    
    // Shop supplies (% of labor)
    const shopSupplies = laborTotal * SHOP_SUPPLY_RATE;
    
    // Buffer (optional, from settings)
    const bufferEnabled = settings.estimate_buffer?.enabled;
    const bufferPercent = settings.estimate_buffer?.percent || 5;
    const buffer = bufferEnabled ? subtotal * (bufferPercent / 100) : 0;
    
    // Tax estimate
    const taxable = subtotal + shopSupplies;
    const tax = taxable * GST_RATE;
    
    // Grand total
    const total = subtotal + shopSupplies + tax + buffer;
    
    return {
      subtotal,
      hours,
      laborTotal,
      shopSupplies,
      buffer,
      bufferPercent,
      bufferEnabled,
      tax,
      total,
      serviceCount: services.length
    };
  }, [services, settings]);

  return {
    services,
    totals,
    addService,
    removeService,
    updateService,
    clearServices
  };
}
