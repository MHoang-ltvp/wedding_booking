import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axiosInstance';
import { paths } from '../api/endpoints';

const STORAGE_KEY = 'vendorRestaurantId';

const VendorRestaurantContext = createContext(null);

export function VendorRestaurantProvider({ children }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);

  const setSelectedRestaurantId = useCallback((id) => {
    const s = id ? String(id) : null;
    setSelectedRestaurantIdState(s);
    if (s) localStorage.setItem(STORAGE_KEY, s);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshRestaurants = useCallback(async () => {
    const { data } = await api.get(paths.vendor.restaurantsMe);
    const list = Array.isArray(data.restaurants) ? data.restaurants : [];
    setRestaurants(list);

    const stored = localStorage.getItem(STORAGE_KEY);
    let next =
      stored && list.some((r) => String(r._id) === String(stored)) ? String(stored) : null;
    if (!next && list.length > 0) next = String(list[0]._id);

    setSelectedRestaurantIdState(next);
    if (next) localStorage.setItem(STORAGE_KEY, next);
    else localStorage.removeItem(STORAGE_KEY);

    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refreshRestaurants();
      } catch {
        if (!cancelled) {
          setRestaurants([]);
          setSelectedRestaurantIdState(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshRestaurants]);

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => String(r._id) === String(selectedRestaurantId)) || null,
    [restaurants, selectedRestaurantId]
  );

  const value = useMemo(
    () => ({
      restaurants,
      selectedRestaurantId,
      selectedRestaurant,
      setSelectedRestaurantId,
      refreshRestaurants,
      loading,
    }),
    [
      restaurants,
      selectedRestaurantId,
      selectedRestaurant,
      setSelectedRestaurantId,
      refreshRestaurants,
      loading,
    ]
  );

  return (
    <VendorRestaurantContext.Provider value={value}>{children}</VendorRestaurantContext.Provider>
  );
}

export function useVendorRestaurant() {
  const ctx = useContext(VendorRestaurantContext);
  if (!ctx) {
    throw new Error('useVendorRestaurant must be used inside VendorRestaurantProvider');
  }
  return ctx;
}
