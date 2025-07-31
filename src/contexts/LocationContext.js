import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';

// Define currency symbols and locales for different countries
const CURRENCY_CONFIG = {
  USD: { symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
  EUR: { symbol: '€', locale: 'de-DE', name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' },
  CAD: { symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
  INR: { symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
  JPY: { symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' },
  CNY: { symbol: '¥', locale: 'zh-CN', name: 'Chinese Yuan' },
  BRL: { symbol: 'R$', locale: 'pt-BR', name: 'Brazilian Real' },
  MXN: { symbol: 'Mex$', locale: 'es-MX', name: 'Mexican Peso' },
};

// Country to currency mapping
const COUNTRY_TO_CURRENCY = {
  US: 'INR',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  IN: 'INR',
  JP: 'JPY',
  CN: 'CNY',
  BR: 'BRL',
  MX: 'MXN',
};

export const LocationContext = createContext();

export const useLocation = () => {
  return useContext(LocationContext);
};

export const LocationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationSettings, setLocationSettings] = useState({
    currency: 'INR',
    autoDetect: true,
    country: null,
  });

  // Auto-detect user's location
  const detectUserLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data && data.country) {
        const detectedCountry = data.country;
        const detectedCurrency = COUNTRY_TO_CURRENCY[detectedCountry] || 'USD';
        
        return {
          country: detectedCountry,
          currency: detectedCurrency,
        };
      }
      
      return null;
    } catch (err) {
      console.error('Error detecting location:', err);
      return null;
    }
  };

  // Fetch user's location settings from Firestore
  const fetchLocationSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      const settingsDoc = await getDoc(doc(db, 'userSettings', currentUser.uid));
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        
        if (data.location) {
          setLocationSettings(data.location);
          
          // If auto-detect is enabled, update the location
          if (data.location.autoDetect) {
            const detectedLocation = await detectUserLocation();
            
            if (detectedLocation) {
              const updatedSettings = {
                ...data.location,
                country: detectedLocation.country,
                currency: detectedLocation.currency,
              };
              
              setLocationSettings(updatedSettings);
              
              // Update in Firestore
              await updateDoc(doc(db, 'userSettings', currentUser.uid), {
                location: updatedSettings,
              });
            }
          }
        } else {
          // If location settings don't exist, detect and create default
          const detectedLocation = await detectUserLocation();
          const defaultSettings = {
            currency: detectedLocation ? detectedLocation.currency : 'USD',
            autoDetect: true,
            country: detectedLocation ? detectedLocation.country : null,
          };
          
          setLocationSettings(defaultSettings);
          
          // Update in Firestore
          await updateDoc(doc(db, 'userSettings', currentUser.uid), {
            location: defaultSettings,
          });
        }
      } else {
        // If settings document doesn't exist, create default settings
        const detectedLocation = await detectUserLocation();
        const defaultSettings = {
          location: {
            currency: detectedLocation ? detectedLocation.currency : 'USD',
            autoDetect: true,
            country: detectedLocation ? detectedLocation.country : null,
          }
        };
        
        setLocationSettings(defaultSettings.location);
        
        // Create in Firestore
        await setDoc(doc(db, 'userSettings', currentUser.uid), defaultSettings);
      }
    } catch (err) {
      console.error('Error fetching location settings:', err);
      setError('Failed to load location settings');
    } finally {
      setLoading(false);
    }
  };

  // Update location settings
  const updateLocationSettings = async (newSettings) => {
    try {
      setError(null);
      
      if (!currentUser) return false;
      
      const updatedSettings = { ...locationSettings, ...newSettings };
      
      // If auto-detect is being enabled, detect location
      if (newSettings.autoDetect && !locationSettings.autoDetect) {
        const detectedLocation = await detectUserLocation();
        
        if (detectedLocation) {
          updatedSettings.country = detectedLocation.country;
          updatedSettings.currency = detectedLocation.currency;
        }
      }
      
      setLocationSettings(updatedSettings);
      
      // Update in Firestore
      await updateDoc(doc(db, 'userSettings', currentUser.uid), {
        location: updatedSettings,
      });
      
      return true;
    } catch (err) {
      console.error('Error updating location settings:', err);
      setError('Failed to update location settings');
      return false;
    }
  };

  // Format currency based on current settings
  const formatCurrency = (amount) => {
    const currency = locationSettings.currency || 'USD';
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
    
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    const currency = locationSettings.currency || 'USD';
    return CURRENCY_CONFIG[currency]?.symbol || '₹';
  };

  // Get available currencies
  const getAvailableCurrencies = () => {
    return Object.keys(CURRENCY_CONFIG).map(code => ({
      code,
      name: CURRENCY_CONFIG[code].name,
      symbol: CURRENCY_CONFIG[code].symbol
    }));
  };

  useEffect(() => {
    fetchLocationSettings();
  }, [currentUser]);

  const value = {
    loading,
    error,
    locationSettings,
    updateLocationSettings,
    formatCurrency,
    getCurrencySymbol,
    getAvailableCurrencies,
    detectUserLocation,
    CURRENCY_CONFIG
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};