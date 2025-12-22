import { useState, useCallback } from 'react';
import { searchContacts, supabaseRpc } from '../utils/supabase';

// ============================================
// useCustomerLookup Hook
// Handles customer search and context loading
// Uses get_customer_booking_context for rich data
// ============================================

export function useCustomerLookup() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search for customers
  const search = useCallback(async (term) => {
    setSearchTerm(term);
    
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchContacts(term);
      setSearchResults(results || []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
    setSearching(false);
  }, []);

  // Select a customer and load their full booking context
  const selectCustomer = useCallback(async (selectedCustomer) => {
    // Set initial customer state while loading
    setCustomer({
      ...selectedCustomer,
      vehicles: [],
      open_workorders: []
    });
    setSearchResults([]);
    setSearchTerm('');
    setLoading(true);

    try {
      // Use the rich context function that returns everything
      const context = await supabaseRpc('get_customer_booking_context', {
        p_customer_id: selectedCustomer.id
      });

      if (context && !context.error) {
        // Map the rich customer data
        const richCustomer = {
          // Spread the original search result (has basic fields)
          ...selectedCustomer,
          
          // Override with rich context data if available
          ...(context.customer || {}),
          
          // Map vehicles with all the rich data
          vehicles: (context.vehicles || []).map(v => ({
            // Core identity
            id: v.vehicle_id,
            vin: v.vin,
            
            // Description
            year: v.year,
            make: v.make,
            model: v.model,
            submodel: v.submodel,
            engine: v.engine,
            color: v.color,
            plate: v.plate,
            unit_number: v.unit_number,
            production_date: v.production_date,
            notes: v.vehicle_notes,
            
            // Computed description for display
            description: `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim(),
            
            // Service history
            last_service_date: v.last_service_date,
            last_mileage: v.last_mileage,
            days_since_service: v.days_since_service,
            
            // Mileage estimation
            avg_daily_km: v.avg_daily_km,
            estimated_current_mileage: v.estimated_current_mileage,
            mileage_confidence: v.mileage_confidence,
            
            // Status calculations
            service_status: v.service_status,
            km_since_service: v.km_since_service,
            km_until_due: v.km_until_due,
            km_status: v.km_status,
            days_until_due: v.days_until_due,
            days_status: v.days_status,
            service_due_reason: v.service_due_reason,
            service_due_summary: v.service_due_summary,
            
            // History preview
            invoice_count_36mo: v.invoice_count_36mo,
            last_3_invoices: v.last_3_invoices || [],
            
            // Build full history array from last_3_invoices for UI compatibility
            history: (v.last_3_invoices || []).map(inv => ({
              workorder_number: inv.workorder_number,
              invoice_date: inv.invoice_date,
              grand_total: inv.grand_total,
              deferred_packages: inv.deferred || [],
              completed_packages: inv.completed || []
            }))
          })),
          
          // Open work orders
          open_workorders: context.open_workorders || []
        };

        setCustomer(richCustomer);
      } else {
        // Fallback: context function failed, keep basic data
        console.warn('get_customer_booking_context returned error:', context?.error);
        // Customer already set with basic data, just clear loading
      }

    } catch (err) {
      console.error('Failed to load customer context:', err);
      // Keep the basic customer data we already set
    }

    setLoading(false);
  }, []);

  // Load full vehicle history when a vehicle is selected
  const loadVehicleHistory = useCallback(async (vin) => {
    if (!vin) return null;
    
    try {
      const history = await supabaseRpc('get_vehicle_full_history', {
        p_vin: vin
      });
      return history;
    } catch (err) {
      console.error('Failed to load vehicle history:', err);
      return null;
    }
  }, []);

  // Clear customer selection
  const clearCustomer = useCallback(() => {
    setCustomer(null);
    setSearchTerm('');
    setSearchResults([]);
  }, []);

  return {
    searchTerm,
    searchResults,
    searching,
    customer,
    loading,
    search,
    selectCustomer,
    loadVehicleHistory,
    clearCustomer
  };
}

export default useCustomerLookup;
