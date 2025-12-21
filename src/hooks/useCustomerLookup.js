import { useState, useCallback } from 'react';
import { searchContacts, getCustomerHistory, getVehicleDetails } from '../utils/supabase';

// ============================================
// useCustomerLookup Hook
// Handles customer search and history loading
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

  // Select a customer and load their history
  const selectCustomer = useCallback(async (selectedCustomer) => {
    // Store full customer object including stats fields
    setCustomer({
      ...selectedCustomer,
      vehicles: [] // Will be populated below
    });
    setSearchResults([]);
    setSearchTerm('');
    setLoading(true);

    try {
      // Get work order history
      const history = await getCustomerHistory(selectedCustomer.file_as);
      
      // Group by vehicle
      const vehicleMap = {};
      (history || []).forEach(wo => {
        const key = wo.vehicle_vin || 'unknown';
        if (!vehicleMap[key]) {
          vehicleMap[key] = {
            vin: wo.vehicle_vin,
            year: wo.vehicle_year,
            make: wo.vehicle_make,
            model: wo.vehicle_model,
            description: wo.vehicle_description,
            id: wo.vehicle_id,
            history: []
          };
        }
        vehicleMap[key].history.push(wo);
      });

      const vehicles = Object.values(vehicleMap);

      // Enrich with vehicle details (plate, mileage)
      if (vehicles.length > 0) {
        const vins = vehicles.map(v => v.vin).filter(Boolean);
        if (vins.length > 0) {
          const details = await getVehicleDetails(vins);
          (details || []).forEach(d => {
            const vehicle = vehicles.find(v => v.vin === d.vin);
            if (vehicle) {
              vehicle.plate = d.plate;
              vehicle.unit_number = d.unit_number;
              vehicle.last_mileage = d.last_mileage;
              vehicle.last_seen_at = d.last_seen_at;
            }
          });
        }
      }

      // Update customer with vehicles - keep ALL original fields
      setCustomer(prev => ({
        ...prev,
        vehicles
      }));

    } catch (err) {
      console.error('Failed to load customer history:', err);
    }

    setLoading(false);
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
    clearCustomer
  };
}

export default useCustomerLookup;
