import React, { useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { Check, Search } from 'lucide-react';
import '../style/LanguageSwitcher.css';

/**
 * LanguageSwitcher component - UI only (no i18n functionality yet)
 * Displays 6 languages with flags, native names, search, and selection indicator
 */
const LanguageSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem("languagePreference") || "en"
  );
  const [searchQuery, setSearchQuery] = useState('');

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', countryCode: 'GB', dir: 'ltr' },
    { code: 'fr', name: 'French', nativeName: 'Français', countryCode: 'FR', dir: 'ltr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', countryCode: 'ES', dir: 'ltr' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', countryCode: 'CN', dir: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', countryCode: 'SA', dir: 'rtl' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', countryCode: 'PT', dir: 'ltr' },
  ];

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLang = languages.find(lang => lang.code === selectedLanguage);

  const handleLanguageSelect = async (langCode) => {
    setSelectedLanguage(langCode);
    localStorage.setItem("languagePreference", langCode);
    setIsOpen(false);
    setSearchQuery('');
    
    const token = 
      localStorage.getItem("jwtToken") ||
      sessionStorage.getItem("jwtToken");

    if (!token) {
      console.warn("No token found; user may not be logged in");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/user/language", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ languagePreference: langCode })
      });

      if (!response.ok) {
        throw new Error("Failed to update language preference", response.status);
      }

    } catch (e) {
      console.error("Failed to update language preference:", e);
    } 

    // Visual feedback only - no actual i18n change yet
    console.log(`Language selected: ${langCode}`);
    
    // Show a brief toast/message (optional)
    const toast = document.createElement('div');
    toast.className = 'language-toast';
    toast.textContent = `Language switched to ${languages.find(l => l.code === langCode)?.nativeName}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  return (
    <div className="language-switcher-wrapper">
      <div className="language-selector">
        <button 
          className="language-button"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="selected-language">
            <span className="flag-emoji">
              {selectedLang?.countryCode && (
                <ReactCountryFlag countryCode={selectedLang.countryCode} svg style={{ width: '1.5em', height: '1.5em' }} title={selectedLang?.name} />
              )}
            </span>
            <span className="language-name">{selectedLang?.nativeName}</span>
          </span>
          <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </button>

        {isOpen && (
          <div className="language-dropdown">
            <div className="dropdown-search">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                autoFocus
              />
            </div>

            <ul className="language-list" role="listbox">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((lang) => (
                  <li
                    key={lang.code}
                    className={`language-option ${selectedLanguage === lang.code ? 'selected' : ''}`}
                    onClick={() => handleLanguageSelect(lang.code)}
                    role="option"
                    aria-selected={selectedLanguage === lang.code}
                  >
                    <span className="flag-emoji">{lang.flag}</span>
                <span className="flag-emoji">
                  {lang.countryCode && (
                    <ReactCountryFlag countryCode={lang.countryCode} svg style={{ width: '1.5em', height: '1.5em' }} title={lang.name} />
                  )}
                </span>
                    <span className="language-details">
                      <span className="language-native">{lang.nativeName}</span>
                      <span className="language-english">{lang.name}</span>
                    </span>
                    {selectedLanguage === lang.code && (
                      <Check size={18} className="check-icon" />
                    )}
                  </li>
                ))
              ) : (
                <li className="no-results">No languages found</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="language-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSwitcher;
