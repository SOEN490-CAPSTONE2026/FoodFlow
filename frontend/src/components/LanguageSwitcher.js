import React, { useState } from 'react';
import { Check, Search } from 'lucide-react';
import '../style/LanguageSwitcher.css';

/**
 * LanguageSwitcher component - UI only (no i18n functionality yet)
 * Displays 6 languages with flags, native names, search, and selection indicator
 */
const LanguageSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', dir: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', dir: 'ltr' },
  ];

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLang = languages.find(lang => lang.code === selectedLanguage);

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
    setIsOpen(false);
    setSearchQuery('');
    
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
