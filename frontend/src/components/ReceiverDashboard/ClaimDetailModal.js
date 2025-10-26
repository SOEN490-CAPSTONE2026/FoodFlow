import React, { useState } from 'react';
import { X, Package, Calendar, MapPin, User, Clock } from 'lucide-react';
import useGoogleMap from '../../hooks/useGoogleMaps';
import ClaimedView from './ClaimedView';
import CompletedView from './CompletedView';
import ReadyForPickUpView from './ReadyForPickUpView';
import BakeryPastryImage from '../../assets/foodtypes/Pastry&Bakery.jpg';
import FruitsVeggiesImage from '../../assets/foodtypes/Fruits&Vegetables.jpg';
import PackagedPantryImage from '../../assets/foodtypes/PackagedItems.jpg';
import DairyColdImage from '../../assets/foodtypes/Dairy.jpg';
import FrozenFoodImage from '../../assets/foodtypes/FrozenFood.jpg';
import PreparedMealsImage from '../../assets/foodtypes/PreparedFood.jpg';
import './Receiver_Styles/ClaimDetailModal.css';

const ClaimDetailModal = ({ claim, isOpen, onClose }) => {
    const post = claim?.surplusPost;
    const [showPickupSteps, setShowPickupSteps] = useState(false);

    const mapRef = useGoogleMap(
        post?.pickupLocation,
        {
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        }
    );

    const getFoodTypeImage = (foodType) => {
        switch (foodType) {
            case 'Bakery & Pastry':
                return BakeryPastryImage;
            case 'Fruits & Vegetables':
                return FruitsVeggiesImage;
            case 'Packaged / Pantry Items':
                return PackagedPantryImage;
            case 'Dairy & Cold Items':
                return DairyColdImage;
            case 'Frozen Food':
                return FrozenFoodImage;
            case 'Prepared Meals':
                return PreparedMealsImage;
            default:
                return PreparedMealsImage;
        }
    };

    const getDisplayStatus = () => {
        const postStatus = post?.status;
        if (postStatus === 'READY_FOR_PICKUP') return 'Ready for Pickup';
        if (postStatus === 'COMPLETED') return 'Completed';
        return 'Claimed';
    };

    const handleViewPickupSteps = () => {
        // Show pickup steps for Claimed, Ready for Pickup, and Completed statuses
        setShowPickupSteps(true);
    };

    const handleBackToDetails = () => {
        setShowPickupSteps(false);
    };

    if (!isOpen || !claim) return null;

    return (
        <>
            <div className="claimed-modal-overlay" onClick={onClose}>
                <div className="claimed-modal-container" onClick={(e) => e.stopPropagation()}>
                    {/* Close Button */}
                    <button className="claimed-modal-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>

                    {/* Modal Header with Image */}
                    <div className="claimed-modal-header">
                        <img
                            src={getFoodTypeImage(post?.foodType || 'Prepared Meals')}
                            alt={post?.title || 'Donation'}
                            className="claimed-modal-header-image"
                        />
                        <span className={`claimed-modal-status-badge claimed-status-${getDisplayStatus().toLowerCase().replace(' ', '-')}`}>
                            {getDisplayStatus()}
                        </span>
                        <div className="claimed-modal-header-overlay">
                            <h2 className="claimed-modal-title">{post?.title || 'Untitled Donation'}</h2>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="claimed-modal-body">
                        <h3 className="claimed-modal-section-title">Donation Details</h3>

                        <div className="claimed-modal-details-grid">
                            {/* Quantity */}
                            <div className="claimed-modal-detail-item">
                                <div className="claimed-modal-detail-icon package">
                                    <Package size={20} />
                                </div>
                                <div className="claimed-modal-detail-content">
                                    <span className="claimed-modal-detail-label">Quantity</span>
                                    <span className="claimed-modal-detail-value">
                                        {post?.quantity?.value || 0} {post?.quantity?.unit || 'items'}
                                    </span>
                                </div>
                            </div>

                            {/* Expiry Date */}
                            <div className="claimed-modal-detail-item">
                                <div className="claimed-modal-detail-icon calendar">
                                    <Calendar size={20} />
                                </div>
                                <div className="claimed-modal-detail-content">
                                    <span className="claimed-modal-detail-label">Expiry Date</span>
                                    <span className="claimed-modal-detail-value">{post?.pickupDate || 'Date TBD'}</span>
                                </div>
                            </div>

                            {/* Donor */}
                            <div className="claimed-modal-detail-item">
                                <div className="claimed-modal-detail-icon user">
                                    <User size={20} />
                                </div>
                                <div className="claimed-modal-detail-content">
                                    <span className="claimed-modal-detail-label">Donor</span>
                                    <span className="claimed-modal-detail-value">{post?.donorEmail || 'Not specified'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pickup Date & Time */}
                        <div className="claimed-modal-section">
                            <div className="claimed-modal-detail-item-full">
                                <div className="claimed-modal-detail-icon clock">
                                    <Clock size={20} />
                                </div>
                                <div className="claimed-modal-detail-content">
                                    <span className="claimed-modal-detail-label">Pickup Date & Time</span>
                                    <span className="claimed-modal-detail-value">
                                        {post?.pickupDate || 'TBD'} • {post?.pickupFrom || '00:00'} - {post?.pickupTo || '00:00'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Pickup Location */}
                        <div className="claimed-modal-section">
                            <div className="claimed-modal-detail-item-full">
                                <div className="claimed-modal-detail-icon map-pin">
                                    <MapPin size={20} />
                                </div>
                                <div className="claimed-modal-detail-content">
                                    <span className="claimed-modal-detail-label">Pickup Location</span>
                                    {post?.pickupLocation?.address ? (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.pickupLocation.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="claimed-modal-detail-value link"
                                        >
                                            {post.pickupLocation.address}
                                        </a>
                                    ) : (
                                        <span className="claimed-modal-detail-value">Not specified</span>
                                    )}
                                </div>
                            </div>

                            {/* Map using the hook */}
                            <div className="claimed-modal-map-container">
                                {post?.pickupLocation?.latitude && post?.pickupLocation?.longitude ? (
                                    <div ref={mapRef} className="claimed-modal-map-view" />
                                ) : (
                                    <div className="claimed-modal-map-placeholder">
                                        <MapPin size={48} />
                                        <p>Map view coming soon</p>
                                        <p className="claimed-modal-map-address">
                                            {post?.pickupLocation?.address || 'Address not specified'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="claimed-modal-actions">
                            <button className="claimed-modal-btn-secondary" onClick={onClose}>
                                Back to Details
                            </button>
                            {(getDisplayStatus() === 'Claimed' || getDisplayStatus() === 'Ready for Pickup' || getDisplayStatus() === 'Completed') && (
                                <button
                                    className="claimed-modal-btn-primary"
                                    onClick={handleViewPickupSteps}
                                >
                                    View Pickup Steps
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pickup Steps Modal */}
            {getDisplayStatus() === 'Claimed' ? (
                <ClaimedView
                    claim={claim}
                    isOpen={showPickupSteps}
                    onClose={() => {
                        setShowPickupSteps(false);
                        onClose();
                    }}
                    onBack={handleBackToDetails}
                />
            ) : getDisplayStatus() === 'Ready for Pickup' ? (
                <ReadyForPickUpView
                    claim={claim}
                    isOpen={showPickupSteps}
                    onClose={() => {
                        setShowPickupSteps(false);
                        onClose();
                    }}
                    onBack={handleBackToDetails}
                />
            ) : (
                <CompletedView
                    claim={claim}
                    isOpen={showPickupSteps}
                    onClose={() => {
                        setShowPickupSteps(false);
                        onClose();
                    }}
                    onBack={handleBackToDetails}
                />
            )}
        </>
    );
};

export default ClaimDetailModal;