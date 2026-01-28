import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { surplusAPI } from '../../services/api';
import { useTimezone } from '../../contexts/TimezoneContext';
import './Donor_Styles/RescheduleModal.css';
import 'react-datepicker/dist/react-datepicker.css';

const parseLocalDate = dateString => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
};

const formatDate = date => (date ? date.toISOString().split('T')[0] : '');

const formatTime = date => {
  if (!date) {
    return '';
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const createEmptySlot = () => ({
  pickupDate: '',
  startTime: '',
  endTime: '',
  notes: '',
});

const RescheduleModal = ({ isOpen, onClose, donationItem, onSuccess }) => {
  const { userTimezone } = useTimezone();
  const [pickupSlots, setPickupSlots] = useState([createEmptySlot()]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expiryDate = useMemo(
    () => parseLocalDate(donationItem?.expiryDate),
    [donationItem?.expiryDate]
  );

  useEffect(() => {
    if (isOpen) {
      setPickupSlots([createEmptySlot()]);
      setError('');
      setMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, donationItem?.id]);

  if (!isOpen) {
    return null;
  }

  const addPickupSlot = () => {
    setPickupSlots(prev => [...prev, createEmptySlot()]);
  };

  const removePickupSlot = index => {
    if (pickupSlots.length > 1) {
      setPickupSlots(pickupSlots.filter((_, i) => i !== index));
    }
  };

  const updatePickupSlot = (index, field, value) => {
    const updatedSlots = [...pickupSlots];
    updatedSlots[index][field] = value;
    setPickupSlots(updatedSlots);
  };

  const validateSlots = () => {
    if (!donationItem) {
      return 'Invalid donation. Please try again.';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!expiryDate) {
      return 'This donation has no expiry date and cannot be rescheduled.';
    }

    if (expiryDate < today) {
      return 'This donation is expired and cannot be rescheduled.';
    }

    const now = new Date();

    for (let i = 0; i < pickupSlots.length; i += 1) {
      const slot = pickupSlots[i];
      if (!slot.pickupDate || !slot.startTime || !slot.endTime) {
        return 'Please fill out all pickup slot fields.';
      }

      const slotDate = new Date(slot.pickupDate);
      slotDate.setHours(0, 0, 0, 0);

      if (slotDate < today) {
        return 'Pickup dates must be today or later.';
      }

      if (slotDate > expiryDate) {
        return 'Pickup dates must be on or before the expiry date.';
      }

      const startTime = slot.startTime;
      const endTime = slot.endTime;
      if (startTime && endTime) {
        const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
        if (endMinutes <= startMinutes) {
          return 'End time must be after start time.';
        }
      }

      if (slotDate.getTime() === today.getTime()) {
        const slotEnd = new Date(slotDate);
        slotEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
        if (slotEnd <= now) {
          return 'Pickup end time must be in the future.';
        }
      }
    }

    return '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');

    const validationError = validateSlots();
    if (validationError) {
      setError(validationError);
      return;
    }

    const formattedSlots = pickupSlots.map(slot => ({
      pickupDate: formatDate(slot.pickupDate),
      startTime: formatTime(slot.startTime),
      endTime: formatTime(slot.endTime),
      notes: slot.notes || null,
    }));

    const submissionData = {
      title: donationItem.title,
      quantity: {
        value: Number(donationItem.quantity?.value || 0),
        unit: donationItem.quantity?.unit || 'KILOGRAM',
      },
      foodCategories: donationItem.foodCategories || [],
      fabricationDate: donationItem.fabricationDate || null,
      expiryDate: donationItem.expiryDate || null,
      pickupSlots: formattedSlots,
      pickupDate: formattedSlots[0].pickupDate,
      pickupFrom: formattedSlots[0].startTime,
      pickupTo: formattedSlots[0].endTime,
      pickupLocation: donationItem.pickupLocation,
      description: donationItem.description || '',
      temperatureCategory: donationItem.temperatureCategory || null,
      packagingType: donationItem.packagingType || null,
      donorTimezone: userTimezone || 'UTC',
    };

    setIsSubmitting(true);
    try {
      await surplusAPI.create(submissionData);
      setMessage('Rescheduled successfully.');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to reschedule donation.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reschedule-overlay" onClick={onClose}>
      <div className="reschedule-modal" onClick={e => e.stopPropagation()}>
        <div className="reschedule-header">
          <h2>Reschedule Pickup</h2>
          <button className="reschedule-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="reschedule-body">
          <p className="reschedule-subtitle">
            Choose new pickup slots for{' '}
            <span className="reschedule-title">{donationItem?.title}</span>.
          </p>

          {donationItem?.expiryDate && (
            <p className="reschedule-expiry">
              Expiry date: {donationItem.expiryDate}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="pickup-slots-header">
              <label className="input-label">Pickup Time Slots *</label>
              <button
                type="button"
                className="btn-add-slot"
                onClick={addPickupSlot}
              >
                <Plus size={16} /> Add Another Slot
              </button>
            </div>

            {pickupSlots.map((slot, index) => (
              <div key={index} className="pickup-slot-card">
                <div className="slot-header">
                  <span className="slot-number">Slot {index + 1}</span>
                  {pickupSlots.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-slot"
                      onClick={() => removePickupSlot(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="slot-content">
                  <div className="slot-row">
                    <div className="input-group third-width">
                      <label className="input-label-small">Date *</label>
                      <DatePicker
                        selected={slot.pickupDate}
                        onChange={date =>
                          updatePickupSlot(index, 'pickupDate', date)
                        }
                        minDate={new Date()}
                        maxDate={expiryDate || undefined}
                        dateFormat="yyyy-MM-dd"
                        className="input-field-small"
                        placeholderText="Select date"
                        required
                      />
                    </div>

                    <div className="input-group third-width">
                      <label className="input-label-small">Start Time *</label>
                      <DatePicker
                        selected={slot.startTime}
                        onChange={date =>
                          updatePickupSlot(index, 'startTime', date)
                        }
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="HH:mm"
                        className="input-field-small"
                        placeholderText="Start"
                        required
                      />
                    </div>

                    <div className="input-group third-width">
                      <label className="input-label-small">End Time *</label>
                      <DatePicker
                        selected={slot.endTime}
                        onChange={date =>
                          updatePickupSlot(index, 'endTime', date)
                        }
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="HH:mm"
                        className="input-field-small"
                        placeholderText="End"
                        required
                      />
                    </div>
                  </div>

                  <div className="slot-row">
                    <div className="input-group full-width">
                      <label className="input-label-small">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        value={slot.notes}
                        onChange={e =>
                          updatePickupSlot(index, 'notes', e.target.value)
                        }
                        className="input-field-small"
                        placeholder="e.g., Use back entrance, Ask for manager"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {error && <div className="reschedule-error">{error}</div>}
            {message && <div className="reschedule-success">{message}</div>}

            <div className="reschedule-actions">
              <button
                type="button"
                className="reschedule-button secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="reschedule-button primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Rescheduling...' : 'Create New Donation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
