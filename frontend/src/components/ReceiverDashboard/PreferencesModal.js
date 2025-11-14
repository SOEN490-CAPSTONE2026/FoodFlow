import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Receiver_Styles/PreferencesModal.css';

const FOOD_TYPES = [
    'Bakery & Pastry',
    'Fruits & Vegetables',
    'Packaged / Pantry Items',
    'Dairy & Cold Items',
    'Frozen Food',
    'Prepared Meals'
];

const PICKUP_WINDOWS = [
    'MORNING',
    'AFTERNOON',
    'EVENING'
];

const PreferencesModal = ({ isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        preferredFoodTypes: [],
        maxCapacity: 50,
        minQuantity: 0,
        maxQuantity: 100,
        preferredPickupWindows: [],
        acceptRefrigerated: true,
        acceptFrozen: true
    });

    // Load existing preferences when modal opens
    useEffect(() => {
        if (isOpen) {
            loadPreferences();
        }
    }, [isOpen]);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            const response = await api.get('/receiver/preferences');
            if (response.data) {
                setFormData({
                    preferredFoodTypes: response.data.preferredFoodTypes || [],
                    maxCapacity: response.data.maxCapacity || 50,
                    minQuantity: response.data.minQuantity || 0,
                    maxQuantity: response.data.maxQuantity || 100,
                    preferredPickupWindows: response.data.preferredPickupWindows || [],
                    acceptRefrigerated: response.data.acceptRefrigerated !== undefined ? response.data.acceptRefrigerated : true,
                    acceptFrozen: response.data.acceptFrozen !== undefined ? response.data.acceptFrozen : true
                });
            }
        } catch (err) {
            console.error('Error loading preferences:', err);
            setError('Failed to load preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleFoodTypeToggle = (foodType) => {
        setFormData(prev => ({
            ...prev,
            preferredFoodTypes: prev.preferredFoodTypes.includes(foodType)
                ? prev.preferredFoodTypes.filter(t => t !== foodType)
                : [...prev.preferredFoodTypes, foodType]
        }));
    };

    const handlePickupWindowToggle = (window) => {
        setFormData(prev => ({
            ...prev,
            preferredPickupWindows: prev.preferredPickupWindows.includes(window)
                ? prev.preferredPickupWindows.filter(w => w !== window)
                : [...prev.preferredPickupWindows, window]
        }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Validation
        if (formData.minQuantity > formData.maxQuantity) {
            setError('Minimum quantity cannot be greater than maximum quantity');
            return;
        }

        if (formData.maxCapacity < 1) {
            setError('Maximum capacity must be at least 1');
            return;
        }

        try {
            setLoading(true);
            
            // Try PUT first (update), if it fails try POST (create)
            try {
                await api.put('/receiver/preferences', formData);
            } catch (putError) {
                if (putError.response?.status === 404) {
                    await api.post('/receiver/preferences', formData);
                } else {
                    throw putError;
                }
            }
            
            setSuccess(true);
            setTimeout(() => {
                onSave && onSave();
                onClose();
            }, 1500);
            
        } catch (err) {
            console.error('Error saving preferences:', err);
            setError(err.response?.data?.message || 'Failed to save preferences');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="preferences-modal-overlay" onClick={onClose}>
            <div className="preferences-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="preferences-modal-header">
                    <h2>Receiver Preferences</h2>
                    <button className="preferences-modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="preferences-form">
                    {/* Food Types Selection */}
                    <div className="form-section">
                        <h3>Preferred Food Types</h3>
                        <p className="form-help-text">Select the types of food your organization can accept</p>
                        <div className="checkbox-grid">
                            {FOOD_TYPES.map(foodType => (
                                <label key={foodType} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.preferredFoodTypes.includes(foodType)}
                                        onChange={() => handleFoodTypeToggle(foodType)}
                                    />
                                    <span>{foodType}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Capacity */}
                    <div className="form-section">
                        <h3>Maximum Capacity</h3>
                        <p className="form-help-text">Maximum number of items you can handle per pickup</p>
                        <input
                            type="number"
                            name="maxCapacity"
                            value={formData.maxCapacity}
                            onChange={handleInputChange}
                            min="1"
                            required
                            className="form-input"
                        />
                    </div>

                    {/* Quantity Range */}
                    <div className="form-section">
                        <h3>Quantity Range</h3>
                        <p className="form-help-text">Acceptable quantity range for donations</p>
                        <div className="range-inputs">
                            <div className="range-input-group">
                                <label>Minimum</label>
                                <input
                                    type="number"
                                    name="minQuantity"
                                    value={formData.minQuantity}
                                    onChange={handleInputChange}
                                    min="0"
                                    required
                                    className="form-input"
                                />
                            </div>
                            <div className="range-input-group">
                                <label>Maximum</label>
                                <input
                                    type="number"
                                    name="maxQuantity"
                                    value={formData.maxQuantity}
                                    onChange={handleInputChange}
                                    min="0"
                                    required
                                    className="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pickup Windows */}
                    <div className="form-section">
                        <h3>Preferred Pickup Windows</h3>
                        <p className="form-help-text">Select your available pickup times</p>
                        <div className="checkbox-grid">
                            {PICKUP_WINDOWS.map(window => (
                                <label key={window} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.preferredPickupWindows.includes(window)}
                                        onChange={() => handlePickupWindowToggle(window)}
                                    />
                                    <span>{window}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Temperature Preferences */}
                    <div className="form-section">
                        <h3>Temperature Preferences</h3>
                        <p className="form-help-text">Types of temperature-controlled items you can accept</p>
                        <div className="checkbox-grid">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="acceptRefrigerated"
                                    checked={formData.acceptRefrigerated}
                                    onChange={handleInputChange}
                                />
                                <span>Accept Refrigerated Items</span>
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="acceptFrozen"
                                    checked={formData.acceptFrozen}
                                    onChange={handleInputChange}
                                />
                                <span>Accept Frozen Items</span>
                            </label>
                        </div>
                    </div>

                    {/* Error/Success Messages */}
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">Preferences saved successfully!</div>}

                    {/* Action Buttons */}
                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Preferences'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PreferencesModal;
