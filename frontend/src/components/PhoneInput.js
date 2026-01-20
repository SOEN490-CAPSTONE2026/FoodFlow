import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import '../style/PhoneInput.css';

// Top 20+ countries by usage
const COUNTRIES = [
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', dialCode: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'IT', dialCode: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', dialCode: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: 'MX', dialCode: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: 'BR', dialCode: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AR', dialCode: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'CN', dialCode: '+86', name: 'China', flag: '🇨🇳' },
  { code: 'JP', dialCode: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', dialCode: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'NL', dialCode: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', dialCode: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', dialCode: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', dialCode: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', dialCode: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: 'PL', dialCode: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: 'RU', dialCode: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: 'ZA', dialCode: '+27', name: 'South Africa', flag: '🇿🇦' },
];

export default function PhoneInput({
  value,
  onChange,
  disabled,
  className,
  placeholder,
}) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default to US
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse initial value if provided (e.g., +15145551234)
  useEffect(() => {
    if (value && value.startsWith('+')) {
      // Find matching country by dial code
      for (const country of COUNTRIES) {
        if (value.startsWith(country.dialCode)) {
          setSelectedCountry(country);
          setPhoneNumber(value.substring(country.dialCode.length));
          break;
        }
      }
    }
  }, []);

  const handlePhoneChange = e => {
    let input = e.target.value;

    // If user tries to paste a full number with +, extract country code and number
    if (input.startsWith('+')) {
      // Find matching country by dial code
      for (const country of COUNTRIES) {
        if (input.startsWith(country.dialCode)) {
          setSelectedCountry(country);
          input = input.substring(country.dialCode.length);
          break;
        }
      }
    }

    // Only allow digits in the phone number field
    const digitsOnly = input.replace(/\D/g, '');
    setPhoneNumber(digitsOnly);

    // Always combine country code + phone number in E.164 format
    // This ensures the number ALWAYS has a country code
    const fullNumber = selectedCountry.dialCode + digitsOnly;
    onChange(fullNumber);
  };

  const handleCountrySelect = country => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    setSearchTerm('');

    // Update parent with new country code
    const fullNumber = country.dialCode + phoneNumber;
    onChange(fullNumber);
  };

  const filteredCountries = COUNTRIES.filter(
    country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm)
  );

  return (
    <div className={`phone-input-container ${className || ''}`}>
      <div className="phone-input-wrapper">
        {/* Country Selector */}
        <div className="country-selector" ref={dropdownRef}>
          <button
            type="button"
            className="country-selector-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={disabled}
          >
            <span className="country-flag">{selectedCountry.flag}</span>
            <span className="country-code">{selectedCountry.dialCode}</span>
            <ChevronDown
              size={16}
              className={`chevron ${dropdownOpen ? 'open' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="country-dropdown">
              <div className="country-search">
                <input
                  type="text"
                  placeholder="Search country..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="country-search-input"
                  autoFocus
                />
              </div>
              <div className="country-list">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map(country => (
                    <button
                      key={country.code}
                      type="button"
                      className={`country-option ${
                        country.code === selectedCountry.code ? 'selected' : ''
                      }`}
                      onClick={() => handleCountrySelect(country)}
                    >
                      <span className="country-flag">{country.flag}</span>
                      <span className="country-name">{country.name}</span>
                      <span className="country-dial-code">
                        {country.dialCode}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="no-results">No countries found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          className="phone-number-input"
          placeholder={placeholder || 'Phone number'}
          value={phoneNumber}
          onChange={handlePhoneChange}
          disabled={disabled}
        />
      </div>

      {/* Helper text showing full E.164 number */}
      {phoneNumber && (
        <div className="phone-preview">
          {selectedCountry.dialCode}
          {phoneNumber}
        </div>
      )}
    </div>
  );
}
