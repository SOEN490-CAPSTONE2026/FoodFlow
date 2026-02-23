import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Package, ArrowUpDown } from 'lucide-react';
import { savedDonationAPI, surplusAPI } from '../../services/api';
import ReceiverDonationCard from './ReceiverDonationCard';
import './ReceiverBrowseModal.css';
import './ReceiverBrowse.css';

export default function ReceiverSavedDonations() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set());
  const [bookmarkingItemIds, setBookmarkingItemIds] = useState(new Set());
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimTargetItem, setClaimTargetItem] = useState(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [sortBy, setSortBy] = useState('date');

  const fetchSavedDonations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await savedDonationAPI.getSavedDonations();
      const savedItems = Array.isArray(response.data) ? response.data : [];
      setItems(savedItems);
      setBookmarkedItems(new Set(savedItems.map(item => item.id)));
      setError(null);
    } catch (fetchError) {
      console.error('Error fetching saved donations:', fetchError);
      setError(
        t(
          'receiverSavedDonations.failedToLoad',
          'Failed to load saved donations'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSavedDonations();
  }, [fetchSavedDonations]);

  const handleMoreClick = useCallback(item => {
    setExpandedCardId(prev => (prev === item.id ? null : item.id));
  }, []);

  const handleBookmark = useCallback(async (item, e) => {
    e.stopPropagation();

    setBookmarkedItems(prev => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    setItems(prev => prev.filter(savedItem => savedItem.id !== item.id));

    setBookmarkingItemIds(prev => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });

    try {
      await savedDonationAPI.unsave(item.id);
      window.dispatchEvent(new Event('saved-donations-updated'));
    } catch (unsaveError) {
      console.error('Error removing saved donation:', unsaveError);
      setBookmarkedItems(prev => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      setItems(prev => [...prev, item]);
    } finally {
      setBookmarkingItemIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, []);

  const confirmClaim = useCallback(
    async (item, slot) => {
      setClaiming(true);
      try {
        await surplusAPI.claim(item.id, slot);
        await savedDonationAPI.unsave(item.id).catch(() => {});
        window.dispatchEvent(new Event('saved-donations-updated'));
        setItems(prev => prev.filter(post => post.id !== item.id));
        setBookmarkedItems(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setClaimModalOpen(false);
        setClaimTargetItem(null);
      } catch (claimError) {
        console.error('Error claiming post:', claimError);
        alert(
          claimError.response?.data?.message ||
            t('receiverBrowse.failedToClaim')
        );
      } finally {
        setClaiming(false);
      }
    },
    [t]
  );

  const handleClaimDonation = useCallback(
    item => {
      if (
        item.pickupSlots &&
        Array.isArray(item.pickupSlots) &&
        item.pickupSlots.length > 0
      ) {
        setClaimTargetItem(item);
        setSelectedSlotIndex(0);
        setClaimModalOpen(true);
        return;
      }

      if (!window.confirm(t('receiverBrowse.confirmClaim'))) {
        return;
      }

      const legacySlot =
        item.pickupDate && item.pickupFrom && item.pickupTo
          ? {
              pickupDate: item.pickupDate,
              startTime: item.pickupFrom,
              endTime: item.pickupTo,
            }
          : null;

      confirmClaim(item, legacySlot);
    },
    [confirmClaim, t]
  );

  const formatBestBeforeDate = useCallback(dateValue => {
    if (!dateValue) {
      return '—';
    }
    try {
      const date = new Date(dateValue);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }, []);

  const formatPickupTime = useCallback((pickupDate, pickupFrom, pickupTo) => {
    if (!pickupDate || !pickupFrom || !pickupTo) {
      return '—';
    }
    try {
      const fromDate = new Date(`${pickupDate}T${pickupFrom}`);
      const dateStr = fromDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const fromTime = fromDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const [hours, minutes] = pickupTo.split(':');
      const hour = parseInt(hours, 10);
      const isPM = hour >= 12;
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const toTime = `${displayHour}:${minutes} ${isPM ? 'PM' : 'AM'}`;
      return `${dateStr} ${fromTime}-${toTime}`;
    } catch {
      return '—';
    }
  }, []);

  const formatPostedTime = useCallback(
    dateString => {
      if (!dateString) {
        return '';
      }
      try {
        const now = new Date();
        const posted = new Date(dateString);
        const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));
        if (diffInHours < 1) {
          return t('receiverBrowse.justNow');
        }
        if (diffInHours === 1) {
          return t('receiverBrowse.hourAgo');
        }
        if (diffInHours < 24) {
          return t('receiverBrowse.hoursAgo', { hours: diffInHours });
        }
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) {
          return t('receiverBrowse.dayAgo');
        }
        return t('receiverBrowse.daysAgo', { days: diffInDays });
      } catch {
        return '';
      }
    },
    [t]
  );

  const formatStatus = useCallback(
    status => {
      switch (status) {
        case 'AVAILABLE':
          return t('receiverBrowse.status.available');
        case 'READY_FOR_PICKUP':
          return t('receiverBrowse.status.readyForPickup');
        case 'CLAIMED':
          return t('receiverBrowse.status.claimed');
        case 'COMPLETED':
          return t('receiverBrowse.status.completed');
        case 'NOT_COMPLETED':
          return t('receiverBrowse.status.notCompleted');
        case 'EXPIRED':
          return t('receiverBrowse.status.expired');
        default:
          return status || t('receiverBrowse.status.available');
      }
    },
    [t]
  );

  const getStatusClass = useCallback(status => {
    switch (status) {
      case 'AVAILABLE':
        return 'status-available';
      case 'READY_FOR_PICKUP':
        return 'status-ready';
      case 'CLAIMED':
        return 'status-claimed';
      case 'COMPLETED':
        return 'status-completed';
      case 'NOT_COMPLETED':
        return 'status-not-completed';
      case 'EXPIRED':
        return 'status-expired';
      default:
        return 'status-available';
    }
  }, []);

  const sortedItems = [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.pickupDate);
    const dateB = new Date(b.createdAt || b.pickupDate);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="receiver-browse-container">
      <div className="receiver-browse-header">
        <h1 className="receiver-section-title-browse">
          {t('receiverSavedDonations.title', 'Saved Donations')}
        </h1>

        <div className="sort-controls">
          <span className="sort-label">
            <ArrowUpDown size={16} />
            {t('receiverBrowse.sortBy')}
          </span>
          <div className="sort-buttons">
            <button
              className={`sort-button ${sortBy === 'date' ? 'active' : ''}`}
              onClick={() => setSortBy('date')}
            >
              <Calendar size={16} />
              {t('receiverBrowse.datePosted')}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="receiver-error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="receiver-loading-state">
          <p>{t('receiverBrowse.loading')}</p>
        </div>
      )}

      {!loading && !error && sortedItems.length === 0 && (
        <div className="receiver-empty-state">
          <Package className="receiver-empty-state-icon" size={64} />
          <p>{t('receiverSavedDonations.empty', 'No saved donations yet.')}</p>
        </div>
      )}

      {!loading && !error && sortedItems.length > 0 && (
        <div className="receiver-donations-list">
          {sortedItems.map(item => (
            <ReceiverDonationCard
              key={item.id}
              item={item}
              t={t}
              expanded={expandedCardId === item.id}
              onToggleMore={handleMoreClick}
              onClaim={handleClaimDonation}
              onBookmark={handleBookmark}
              isBookmarked={bookmarkedItems.has(item.id)}
              isBookmarking={bookmarkingItemIds.has(item.id)}
              claiming={claiming}
              isClaimTarget={claimTargetItem?.id === item.id}
              formatBestBeforeDate={formatBestBeforeDate}
              formatPickupTime={formatPickupTime}
              formatPostedTime={formatPostedTime}
              formatStatus={formatStatus}
              getStatusClass={getStatusClass}
            />
          ))}
        </div>
      )}

      <ClaimModal
        open={claimModalOpen}
        item={claimTargetItem}
        selectedIndex={selectedSlotIndex}
        onSelectIndex={idx => setSelectedSlotIndex(idx)}
        onConfirm={slot => confirmClaim(claimTargetItem, slot)}
        onClose={() => {
          setClaimModalOpen(false);
          setClaimTargetItem(null);
        }}
        loading={claiming}
        formatFn={formatPickupTime}
      />
    </div>
  );
}

function ClaimModal({
  open,
  item,
  selectedIndex,
  onSelectIndex,
  onConfirm,
  onClose,
  loading,
  formatFn,
}) {
  const { t } = useTranslation();
  if (!open || !item) {
    return null;
  }

  const slots = Array.isArray(item.pickupSlots) ? item.pickupSlots : [];

  return (
    <div className="claim-modal-overlay" role="dialog" aria-modal="true">
      <div className="claim-modal-card">
        <h3>{t('receiverBrowse.choosePickupSlot', 'Choose a pickup slot')}</h3>
        {slots.length === 0 && (
          <div className="claim-modal-empty">
            {t(
              'receiverBrowse.noProposedSlots',
              'No proposed slots available.'
            )}
          </div>
        )}
        <div className="claim-slots-list">
          {slots.map((slot, idx) => {
            const date = slot.pickupDate || slot.date || '';
            const from = slot.startTime || slot.pickupFrom || slot.from || '';
            const to = slot.endTime || slot.pickupTo || slot.to || '';
            const display = formatFn ? formatFn(date, from, to) : '';
            return (
              <label
                key={idx}
                className={`claim-slot-item ${selectedIndex === idx ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="pickupSlot"
                  checked={selectedIndex === idx}
                  onChange={() => onSelectIndex(idx)}
                />
                <div className="claim-slot-content">
                  <div className="claim-slot-time">{display}</div>
                  {slot.notes && (
                    <div className="claim-slot-notes">{slot.notes}</div>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div className="claim-modal-actions">
          <button
            className="btn btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-create"
            onClick={() => {
              const selectedSlot = slots[selectedIndex];
              const normalized = selectedSlot
                ? {
                    pickupDate: selectedSlot.pickupDate || selectedSlot.date,
                    startTime:
                      selectedSlot.startTime || selectedSlot.pickupFrom,
                    endTime: selectedSlot.endTime || selectedSlot.pickupTo,
                    notes: selectedSlot.notes || null,
                    id: selectedSlot.id || undefined,
                  }
                : null;
              onConfirm(normalized);
            }}
            disabled={loading || slots.length === 0}
          >
            {loading
              ? t('receiverBrowse.confirming')
              : t('receiverBrowse.confirmAndClaim')}
          </button>
        </div>
      </div>
    </div>
  );
}
