
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ChevronRight, ChevronDown, Search, Gift, Users, Flag, Edit3, Eye, Sparkles, Handshake } from 'lucide-react';
import './Admin_Styles/AdminDonations.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";


const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELED', label: 'Canceled' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'FLAGGED', label: 'Flagged' },
];

const mockDonations = [
  {
    id: 101,
    title: 'Fresh Apples',
    status: 'ACTIVE',
    donorName: 'Green Farm',
    receiverName: 'Food Bank A',
    flagged: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'Produce',
    quantity: '50kg',
    temperature: '4°C',
    packaging: 'Boxed',
    pickupEvidence: '',
    timeline: [
      { eventType: 'CREATED', timestamp: new Date().toISOString(), actor: 'admin', oldStatus: null, newStatus: 'ACTIVE' }
    ]
  },
  {
    id: 102,
    title: 'Canned Beans',
    status: 'COMPLETED',
    donorName: 'SuperMart',
    receiverName: 'Shelter B',
    flagged: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    type: 'Canned',
    quantity: '100 cans',
    temperature: 'Room',
    packaging: 'Crate',
    pickupEvidence: '',
    timeline: [
      { eventType: 'CREATED', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'admin', oldStatus: null, newStatus: 'ACTIVE' },
      { eventType: 'COMPLETED', timestamp: new Date(Date.now() - 86400000).toISOString(), actor: 'admin', oldStatus: 'ACTIVE', newStatus: 'COMPLETED' }
    ]
  },
  {
    id: 103,
    title: 'Bakery Items',
    status: 'FLAGGED',
    donorName: 'Bakery House',
    receiverName: 'Charity C',
    flagged: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    type: 'Bakery',
    quantity: '30kg',
    temperature: 'Room',
    packaging: 'Bagged',
    pickupEvidence: '',
    timeline: [
      { eventType: 'CREATED', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), actor: 'admin', oldStatus: null, newStatus: 'ACTIVE' },
      { eventType: 'FLAGGED', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), actor: 'admin', oldStatus: 'ACTIVE', newStatus: 'FLAGGED' }
    ]
  }
];

const AdminDonations = () => {
  const [donations] = useState(mockDonations);
  const [filteredDonations, setFilteredDonations] = useState(mockDonations);
  const [stats] = useState({
    totalDonations: mockDonations.length,
    active: mockDonations.filter(d => d.status === 'ACTIVE').length,
    completed: mockDonations.filter(d => d.status === 'COMPLETED').length,
    flagged: mockDonations.filter(d => d.flagged).length,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState('');



  // No API, only hardcoded mock data

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Client-side search
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredDonations(donations);
      return;
    }
    const searchLower = debouncedSearchTerm.toLowerCase();
    setFilteredDonations(
      donations.filter(d =>
        (d.title || '').toLowerCase().includes(searchLower) ||
        (d.donorName || '').toLowerCase().includes(searchLower) ||
        (d.receiverName || '').toLowerCase().includes(searchLower) ||
        (d.id || '').toString().includes(searchLower)
      )
    );
  }, [donations, debouncedSearchTerm]);

  const handleResetFilters = () => {
    setStatusFilter('');
    setSearchTerm('');
  };

  const openDetailModal = (donation) => {
    setSelectedDonation(donation);
    setShowDetailModal(true);
    setOverrideStatus('');
    setOverrideError('');
    setOverrideSuccess('');
  };

  const handleOverrideStatus = () => {
    if (!overrideStatus) return;
    setOverrideLoading(true);
    setOverrideError('');
    setOverrideSuccess('');
    setTimeout(() => {
      setOverrideSuccess('Status updated successfully. (mock)');
      setShowDetailModal(false);
      setOverrideLoading(false);
    }, 800);
  };

  // No loading state needed for hardcoded data

  // Custom styles for React Select
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '42px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#d1d5db'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      cursor: 'pointer'
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    })
  };

  return (
    <div className="admin-users-container">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e3f2fd' }}>
            <Gift style={{ color: '#2196f3' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Donations</div>
            <div className="stat-value">{stats.totalDonations}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f5e9' }}>
            <Users style={{ color: '#4caf50' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active</div>
            <div className="stat-value">{stats.active}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff3e0' }}>
            <Sparkles style={{ color: '#ff9800' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats.completed}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3e5f5' }}>
            <Flag style={{ color: '#9c27b0' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Flagged</div>
            <div className="stat-value">{stats.flagged}</div>
          </div>
        </div>
      </div>

      {/* All Donations Section */}
      <div className="users-section">
        <div className="users-section-header">
          <h2>All Donations</h2>
          <div className="pagination-info">
            {filteredDonations.length > 0 && (
              <span>1 - {filteredDonations.length} of {stats.totalDonations}</span>
            )}
          </div>
        </div>

        {/* Search Bar and Filters */}
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by title, donor, receiver, or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filters-wrapper">
            <Select
              value={statusOptions.find(opt => opt.value === statusFilter)}
              onChange={option => setStatusFilter(option.value)}
              options={statusOptions}
              styles={selectStyles}
              className="filter-select-react"
              placeholder="All Status"
              isSearchable={false}
            />
            {/* Add donor/receiver/flagged/date filters as needed */}
            <button onClick={handleResetFilters} className="filter-reset-btn">Reset</button>
          </div>
        </div>
      </div>

      {/* No error message for hardcoded data */}

      {/* Donations Table */}
      <div className="users-table-container">
        <Table className="users-table">
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead>Flagged</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDonations.length === 0 ? (
              <TableRow>
                <TableCell colSpan="10" className="no-users">No donations found</TableCell>
              </TableRow>
            ) : (
              filteredDonations.map(donation => (
                <React.Fragment key={donation.id}>
                  <TableRow className={expandedRows.has(donation.id) ? 'expanded' : ''}>
                    <TableCell>
                      <button
                        className="expand-btn"
                        onClick={() => {
                          const newExpanded = new Set(expandedRows);
                          if (newExpanded.has(donation.id)) newExpanded.delete(donation.id);
                          else newExpanded.add(donation.id);
                          setExpandedRows(newExpanded);
                        }}
                      >
                        {expandedRows.has(donation.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </TableCell>
                    <TableCell className="id-cell">{donation.id}</TableCell>
                    <TableCell>{donation.title}</TableCell>
                    <TableCell>
                      <span className={`pill pill-status-${donation.status?.toLowerCase()}`}>{donation.status}</span>
                    </TableCell>
                    <TableCell>{donation.donorName}</TableCell>
                    <TableCell>{donation.receiverName}</TableCell>
                    <TableCell>{donation.flagged ? <Flag color="red" size={16} /> : ''}</TableCell>
                    <TableCell>{donation.createdAt ? new Date(donation.createdAt).toLocaleString() : ''}</TableCell>
                    <TableCell>{donation.updatedAt ? new Date(donation.updatedAt).toLocaleString() : ''}</TableCell>
                    <TableCell>
                      <button className="action-btn" onClick={() => openDetailModal(donation)} title="View Details">
                        <Eye size={16} />
                      </button>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(donation.id) && (
                    <TableRow className="details-row">
                      <TableCell colSpan="10">
                        <div className="user-details-expanded">
                          <div className="details-grid">
                            <div className="details-section">
                              <h4>Type</h4>
                              <p className="details-value">{donation.type}</p>
                            </div>
                            <div className="details-section">
                              <h4>Quantity</h4>
                              <p className="details-value">{donation.quantity}</p>
                            </div>
                            <div className="details-section">
                              <h4>Temperature</h4>
                              <p className="details-value">{donation.temperature}</p>
                            </div>
                            <div className="details-section">
                              <h4>Packaging</h4>
                              <p className="details-value">{donation.packaging}</p>
                            </div>
                          </div>
                          <div className="details-activity">
                            <h4>Pickup Evidence</h4>
                            <ul className="activity-list">
                              <li>{donation.pickupEvidence ? <a href={donation.pickupEvidence} target="_blank" rel="noopener noreferrer">View</a> : 'N/A'}</li>
                            </ul>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Donation Detail Modal */}
      {showDetailModal && selectedDonation && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-donation-detail" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            <h2>Donation Details</h2>
            <div><strong>ID:</strong> {selectedDonation.id}</div>
            <div><strong>Title:</strong> {selectedDonation.title}</div>
            <div><strong>Status:</strong> {selectedDonation.status}</div>
            <div><strong>Donor:</strong> {selectedDonation.donorName}</div>
            <div><strong>Receiver:</strong> {selectedDonation.receiverName}</div>
            <div><strong>Flagged:</strong> {selectedDonation.flagged ? 'Yes' : 'No'}</div>
            <div><strong>Created:</strong> {selectedDonation.createdAt ? new Date(selectedDonation.createdAt).toLocaleString() : ''}</div>
            <div><strong>Updated:</strong> {selectedDonation.updatedAt ? new Date(selectedDonation.updatedAt).toLocaleString() : ''}</div>
            <div><strong>Temperature:</strong> {selectedDonation.temperature}</div>
            <div><strong>Packaging:</strong> {selectedDonation.packaging}</div>
            <div><strong>Pickup Evidence:</strong> {selectedDonation.pickupEvidence ? <a href={selectedDonation.pickupEvidence} target="_blank" rel="noopener noreferrer">View Evidence</a> : 'N/A'}</div>
            {/* Timeline (admins only) */}
            <div className="timeline-section">
              <h3>Timeline <span>(Admin Only)</span></h3>
              <ul className="timeline-list">
                {selectedDonation.timeline && selectedDonation.timeline.length > 0 ? (
                  selectedDonation.timeline.map((event, idx) => (
                    <li key={idx}>
                      <span className="timeline-event-type">{event.eventType}</span> &nbsp;
                      <span className="timeline-timestamp">{new Date(event.timestamp).toLocaleString()}</span> &nbsp;
                      <span className="timeline-actor">{event.actor}</span> &nbsp;
                      {event.oldStatus && event.newStatus && (
                        <span className="timeline-status-change">{event.oldStatus} → {event.newStatus}</span>
                      )}
                    </li>
                  ))
                ) : (
                  <li>No timeline events.</li>
                )}
              </ul>
            </div>
            {/* Status Override */}
            <div className="override-section">
              <label>Adjust Status</label>
              <Select
                value={statusOptions.find(opt => opt.value === overrideStatus)}
                onChange={option => setOverrideStatus(option.value)}
                options={statusOptions.filter(opt => opt.value && opt.value !== selectedDonation.status)}
                styles={selectStyles}
                className="filter-select-react"
                placeholder="Select new status"
                isSearchable={false}
              />
              <button className="btn-confirm" onClick={handleOverrideStatus} disabled={overrideLoading}>
                {overrideLoading ? 'Updating...' : 'Override Status'}
              </button>
              {overrideError && <div className="error-message">{overrideError}</div>}
              {overrideSuccess && <div className="success-message">{overrideSuccess}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDonations;
