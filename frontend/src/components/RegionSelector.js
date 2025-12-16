import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Loader, ChevronDown, Check } from 'lucide-react';
import '../style/RegionSelector.css';

const RegionSelector = ({ value, onChange }) => {
  const [selectedCountry, setSelectedCountry] = useState(value?.country || '');
  const [selectedCity, setSelectedCity] = useState(value?.city || '');
  const [selectedTimezone, setSelectedTimezone] = useState(value?.timezone || '');
  
  const [countries, setCountries] = useState([]);
  const [timezones, setTimezones] = useState([]);
  
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  
  const countryDropdownRef = useRef(null);
  const timezoneDropdownRef = useRef(null);

  // Load countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,timezones');
        const data = await response.json();
        
        const sortedCountries = data
          .map(country => ({
            code: country.cca2,
            name: country.name.common,
            timezones: country.timezones || []
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setCountries(sortedCountries);
        setLoadingCountries(false);
      } catch (error) {
        console.error('Error loading countries:', error);
        setLoadingCountries(false);
      }
    };
    
    loadCountries();
  }, []);

  // Load saved values on mount
  useEffect(() => {
    const saved = localStorage.getItem('userRegion');
    if (saved && !value) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedCountry(parsed.country);
        setSelectedCity(parsed.city);
        setSelectedTimezone(parsed.timezone);
      } catch (e) {
        console.error('Error loading saved region:', e);
      }
    }
  }, [value]);

  // Update timezones when country changes
  useEffect(() => {
    if (selectedCountry) {
      const country = countries.find(c => c.code === selectedCountry);
      if (country) {
        setTimezones(country.timezones);
        
        if (country.timezones.length === 1) {
          setSelectedTimezone(country.timezones[0]);
        } else if (!selectedTimezone) {
          // Try to auto-detect from browser
          const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (country.timezones.includes(browserTz)) {
            setSelectedTimezone(browserTz);
          } else {
            setSelectedTimezone(country.timezones[0]);
          }
        }
      }
    } else {
      setTimezones([]);
      setSelectedTimezone('');
    }
  }, [selectedCountry, countries]);

  // Auto-detect location using browser geolocation
  const detectLocation = async () => {
    setDetectingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding API 
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await response.json();
          
          if (data.address) {
            const countryCode = data.address.country_code?.toUpperCase();
            const city = data.address.city || data.address.town || data.address.village || '';
            
            if (countryCode) {
              setSelectedCountry(countryCode);
              setSelectedCity(city);
              
              // Timezone from browser
              const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
              setSelectedTimezone(browserTz);
            }
          }
        } catch (error) {
          console.error('Error detecting location:', error);
          alert('Failed to detect location. Please select manually.');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to access your location. Please select manually.');
        setDetectingLocation(false);
      }
    );
  };

  // Persist changes
  useEffect(() => {
    if (selectedCountry && selectedCity && selectedTimezone) {
      const regionData = {
        country: selectedCountry,
        countryName: countries.find(c => c.code === selectedCountry)?.name,
        city: selectedCity,
        timezone: selectedTimezone,
      };
      
      localStorage.setItem('userRegion', JSON.stringify(regionData));
      
      if (onChange) {
        onChange(regionData);
      }
    }
  }, [selectedCountry, selectedCity, selectedTimezone, onChange, countries]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
      if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(event.target)) {
        setShowTimezoneDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (countryCode) => {
    setSelectedCountry(countryCode);
    setSelectedCity('');
    setShowCountryDropdown(false);
    setCountrySearch('');
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };

  const handleTimezoneSelect = (timezone) => {
    setSelectedTimezone(timezone);
    setShowTimezoneDropdown(false);
  };

  const formatTimezone = (timezone) => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short',
      });
      const parts = formatter.formatToParts(now);
      const tzName = parts.find(part => part.type === 'timeZoneName')?.value || '';
      
      return `${timezone.split('/').pop().replace(/_/g, ' ')} (${tzName})`;
    } catch (e) {
      return timezone;
    }
  };

  const selectedCountryData = countries.find(c => c.code === selectedCountry);
  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="region-selector">
      {/* Auto-detect button */}
      <button
        type="button"
        className="auto-detect-button"
        onClick={detectLocation}
        disabled={detectingLocation || loadingCountries}
      >
        {detectingLocation ? (
          <>
            <Loader size={16} className="spinner" />
            Detecting location...
          </>
        ) : (
          <>
            <MapPin size={16} />
            Auto-detect my location
          </>
        )}
      </button>

      <div className="region-field-group">
        {/* Country Selection */}
        <div className="region-field" ref={countryDropdownRef}>
          <label className="region-label">
            <MapPin size={16} />
            Country
          </label>
          <div 
            className={`custom-select ${showCountryDropdown ? 'open' : ''}`}
            onClick={() => !loadingCountries && setShowCountryDropdown(!showCountryDropdown)}
          >
            <div className="select-trigger">
              <span className={selectedCountry ? 'selected' : 'placeholder'}>
                {selectedCountry 
                  ? selectedCountryData?.name 
                  : loadingCountries ? 'Loading countries...' : 'Select your country...'}
              </span>
              <ChevronDown size={20} className="chevron-icon" />
            </div>
            
            {showCountryDropdown && (
              <div className="select-dropdown">
                <div className="dropdown-search">
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-options">
                  {filteredCountries.map(country => (
                    <div
                      key={country.code}
                      className={`dropdown-option ${selectedCountry === country.code ? 'selected' : ''}`}
                      onClick={() => handleCountrySelect(country.code)}
                    >
                      <span>{country.name}</span>
                      {selectedCountry === country.code && <Check size={18} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* City Input */}
        {selectedCountry && (
          <div className="region-field">
            <label className="region-label">
              <MapPin size={16} />
              City
            </label>
            <input
              type="text"
              className="region-input"
              value={selectedCity}
              onChange={handleCityChange}
              placeholder="Enter your city..."
            />
          </div>
        )}

        {/* Timezone Selection */}
        {selectedCountry && timezones.length > 0 && (
          <div className="region-field" ref={timezoneDropdownRef}>
            <label className="region-label">
              <Clock size={16} />
              Timezone
            </label>
            <div 
              className={`custom-select ${showTimezoneDropdown ? 'open' : ''}`}
              onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
            >
              <div className="select-trigger">
                <span className={selectedTimezone ? 'selected' : 'placeholder'}>
                  {selectedTimezone ? formatTimezone(selectedTimezone) : 'Select timezone...'}
                </span>
                <ChevronDown size={20} className="chevron-icon" />
              </div>
              
              {showTimezoneDropdown && (
                <div className="select-dropdown">
                  <div className="dropdown-options">
                    {timezones.map(tz => (
                      <div
                        key={tz}
                        className={`dropdown-option ${selectedTimezone === tz ? 'selected' : ''}`}
                        onClick={() => handleTimezoneSelect(tz)}
                      >
                        <span>{formatTimezone(tz)}</span>
                        {selectedTimezone === tz && <Check size={18} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <small className="region-hint">
              {timezones.length === 1 
                ? 'Automatically set based on your country'
                : 'Your timezone has been auto-detected. You can change it if needed.'}
            </small>
          </div>
        )}
      </div>

      {/* Current Selection Summary */}
      {selectedCountry && selectedCity && selectedTimezone && (
        <div className="region-summary">
          <div className="region-summary-item">
            <MapPin size={14} />
            <span>{selectedCity}, {selectedCountryData?.name}</span>
          </div>
          <div className="region-summary-item">
            <Clock size={14} />
            <span>{formatTimezone(selectedTimezone)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionSelector;
