import React, { useRef, useEffect, useState } from 'react';
import { Download, FileText, File } from 'lucide-react';
import './ExportDropdown.css';

/**
 * Export Dropdown Component
 * Provides a dropdown menu for selecting export format (CSV or PDF)
 */
export default function ExportDropdown({
  onExportCSV,
  onExportPDF,
  disabled = false,
  label = 'Export',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExportCSV = () => {
    onExportCSV();
    setIsOpen(false);
  };

  const handleExportPDF = () => {
    onExportPDF();
    setIsOpen(false);
  };

  return (
    <div className="export-dropdown-container" ref={dropdownRef}>
      <button
        className="export-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        title="Click to export in CSV or PDF format"
      >
        <Download size={18} />
        {label}
      </button>

      {isOpen && (
        <div className="export-dropdown-menu">
          <button
            className="export-menu-item"
            onClick={handleExportCSV}
            disabled={disabled}
          >
            <File size={16} />
            <span>Export CSV</span>
            <span className="export-menu-hint">For spreadsheet analysis</span>
          </button>
          <button
            className="export-menu-item"
            onClick={handleExportPDF}
            disabled={disabled}
          >
            <FileText size={16} />
            <span>Export PDF</span>
            <span className="export-menu-hint">For presentation & sharing</span>
          </button>
        </div>
      )}
    </div>
  );
}
