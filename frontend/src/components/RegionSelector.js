import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Loader, ChevronDown, Check } from 'lucide-react';
import '../style/RegionSelector.css';

const RegionSelector = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState('');

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
        const response = await fetch(
          'https://restcountries.com/v3.1/all?fields=name,cca2,timezones'
        );
        const data = await response.json();

        const sortedCountries = data
          .map(country => ({
            code: country.cca2,
            name: country.name.common,
            timezones: country.timezones || [],
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountries(sortedCountries);
        setLoadingCountries(false);
      } catch (error) {
        setLoadingCountries(false);
      }
    };

    loadCountries();
  }, []);

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
  }, [selectedCountry, countries, selectedTimezone]);

  // Auto-detect location using browser geolocation
  const detectLocation = async () => {
    setDetectingLocation(true);

    if (!navigator.geolocation) {
      alert(t('regionSelector.geolocationUnsupported'));
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          // Use reverse geocoding API
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await response.json();

          if (data.address) {
            const countryCode = data.address.country_code?.toUpperCase();
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              '';

            if (countryCode) {
              setSelectedCountry(countryCode);
              setSelectedCity(city);

              // Timezone from browser
              const browserTz =
                Intl.DateTimeFormat().resolvedOptions().timeZone;
              setSelectedTimezone(browserTz);

              // Save to backend immediately after auto-detect
              const getUTCOffset = tz => {
                try {
                  const now = new Date();
                  const tzDate = new Date(
                    now.toLocaleString('en-US', { timeZone: tz })
                  );
                  const utcDate = new Date(
                    now.toLocaleString('en-US', { timeZone: 'UTC' })
                  );
                  const offset = (tzDate - utcDate) / (1000 * 60 * 60);
                  const sign = offset >= 0 ? '+' : '-';
                  const absOffset = Math.abs(offset);
                  const hours = Math.floor(absOffset);
                  const minutes = Math.round((absOffset - hours) * 60);
                  return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                } catch (e) {
                  return 'UTC+00:00';
                }
              };

              const country = countries.find(c => c.code === countryCode);
              const regionData = {
                country: countryCode,
                countryName: country?.name || countryCode,
                city: city,
                timezone: browserTz,
                timezoneOffset: getUTCOffset(browserTz),
                utcOffset: getUTCOffset(browserTz),
              };

              if (onChange) {
                onChange(regionData);
              }
            }
          }
        } catch (error) {
          alert(t('regionSelector.detectFailed'));
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        alert(t('regionSelector.accessLocationFailed'));
        setDetectingLocation(false);
      }
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setShowCountryDropdown(false);
      }
      if (
        timezoneDropdownRef.current &&
        !timezoneDropdownRef.current.contains(event.target)
      ) {
        setShowTimezoneDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = countryCode => {
    setSelectedCountry(countryCode);
    setSelectedCity('');
    setShowCountryDropdown(false);
    setCountrySearch('');
  };

  const handleCityChange = e => {
    setSelectedCity(e.target.value);
  };

  const handleTimezoneSelect = timezone => {
    setSelectedTimezone(timezone);
    setShowTimezoneDropdown(false);

    // Only save to backend when user explicitly selects timezone
    if (selectedCountry && selectedCity && timezone) {
      const getUTCOffset = tz => {
        try {
          const now = new Date();
          const tzDate = new Date(
            now.toLocaleString('en-US', { timeZone: tz })
          );
          const utcDate = new Date(
            now.toLocaleString('en-US', { timeZone: 'UTC' })
          );
          const offset = (tzDate - utcDate) / (1000 * 60 * 60);
          const sign = offset >= 0 ? '+' : '-';
          const absOffset = Math.abs(offset);
          const hours = Math.floor(absOffset);
          const minutes = Math.round((absOffset - hours) * 60);
          return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } catch (e) {
          return 'UTC+00:00';
        }
      };

      const regionData = {
        country: selectedCountry,
        countryName: countries.find(c => c.code === selectedCountry)?.name,
        city: selectedCity,
        timezone: timezone,
        timezoneOffset: getUTCOffset(timezone),
        utcOffset: getUTCOffset(timezone),
      };

      if (onChange) {
        onChange(regionData);
      }
    }
  };

  const formatTimezone = timezone => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short',
      });
      const parts = formatter.formatToParts(now);
      const tzName =
        parts.find(part => part.type === 'timeZoneName')?.value || '';

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
            {t('regionSelector.detecting')}
          </>
        ) : (
          <>
            <MapPin size={16} />
            {t('regionSelector.autoDetect')}
          </>
        )}
      </button>

      <div className="region-field-group">
        {/* Country Selection */}
        <div className="region-field" ref={countryDropdownRef}>
          <label className="region-label">
            <MapPin size={16} />
            {t('regionSelector.country')}
          </label>
          <div
            className={`custom-select ${showCountryDropdown ? 'open' : ''}`}
            onClick={() =>
              !loadingCountries && setShowCountryDropdown(!showCountryDropdown)
            }
          >
            <div className="select-trigger">
              <span className={selectedCountry ? 'selected' : 'placeholder'}>
                {selectedCountry
                  ? selectedCountryData?.name
                  : loadingCountries
                    ? t('regionSelector.loadingCountries')
                    : t('regionSelector.selectCountry')}
              </span>
              <ChevronDown size={20} className="chevron-icon" />
            </div>

            {showCountryDropdown && (
              <div className="select-dropdown">
                <div className="dropdown-search">
                  <input
                    type="text"
                    placeholder={t('regionSelector.searchCountries')}
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
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
              {t('regionSelector.city')}
            </label>
            <input
              type="text"
              className="region-input"
              value={selectedCity}
              onChange={handleCityChange}
              placeholder={t('regionSelector.enterCity')}
            />
          </div>
        )}

        {/* Timezone Selection */}
        {selectedCountry && timezones.length > 0 && (
          <div className="region-field" ref={timezoneDropdownRef}>
            <label className="region-label">
              <Clock size={16} />
              {t('regionSelector.timezone')}
            </label>
            <div
              className={`custom-select ${showTimezoneDropdown ? 'open' : ''}`}
              onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
            >
              <div className="select-trigger">
                <span className={selectedTimezone ? 'selected' : 'placeholder'}>
                  {selectedTimezone
                    ? formatTimezone(selectedTimezone)
                    : t('regionSelector.selectTimezone')}
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
                ? t('regionSelector.autoSetCountry')
                : t('regionSelector.autoDetectedHint')}
            </small>
          </div>
        )}
      </div>

      {/* Current Selection Summary - Shows backend data */}
      {value && value.timezone && (
        <div className="region-summary">
          <div className="region-summary-item">
            <MapPin size={14} />
            <span>
              {value.city}, {value.country}
            </span>
          </div>
          <div className="region-summary-item">
            <Clock size={14} />
            <span>{formatTimezone(value.timezone)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionSelector;

RegionSelector.propTypes = {
  value: PropTypes.shape({
    timezone: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
  }),
  onChange: PropTypes.func,
};
