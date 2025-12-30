import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { X, Package, Calendar, MapPin, User, Clock, MessageCircle } from 'lucide-react';
import useGoogleMap from '../../hooks/useGoogleMaps';
import ClaimedView from './ClaimedView';
import CompletedView from './CompletedView';
import ReadyForPickUpView from './ReadyForPickUpView';
import { getPrimaryFoodCategory, foodTypeImages, getUnitLabel } from '../../constants/foodConstants';
import { useTimezone } from '../../contexts/TimezoneContext';
import './Receiver_Styles/ClaimDetailModal.css';

const ClaimDetailModal = ({ claim, isOpen, onClose }) => {
    const post = claim?.surplusPost;
    const [showPickupSteps, setShowPickupSteps] = useState(false);
    const navigate = useNavigate();
    const { userTimezone } = useTimezone();

    const formatPickupTime = (pickupDate, pickupFrom, pickupTo) => {
        if (!pickupDate || !pickupFrom || !pickupTo) return "—";
        try {
            // Backend sends LocalDateTime, treat as UTC by adding 'Z'
            let fromDateStr = `${pickupDate}T${pickupFrom}`;
            if (!fromDateStr.endsWith('Z') && !fromDateStr.includes('+')) {
                fromDateStr = fromDateStr + 'Z';
            }
            let toDateStr = `${pickupDate}T${pickupTo}`;
            if (!toDateStr.endsWith('Z') && !toDateStr.includes('+')) {
                toDateStr = toDateStr + 'Z';
            }
            
            const fromDate = new Date(fromDateStr);
            const toDate = new Date(toDateStr);
            
            const dateStr = fromDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: userTimezone
            });
            const fromTime = fromDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: userTimezone
            });
            const toTime = toDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: userTimezone
            });
            return `${dateStr} ${fromTime}-${toTime}`;
        } catch (error) {
            console.error('Error formatting pickup time:', error);
            return "—";
        }
    };
    const mapRef = useGoogleMap(
        post?.pickupLocation,
        {
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        }
    );



    const getDisplayStatus = () => {
        const postStatus = post?.status;
        if (postStatus === 'READY_FOR_PICKUP') return 'Ready for Pickup';
        if (postStatus === 'COMPLETED') return 'Completed';
        if (postStatus === 'NOT_COMPLETED') return 'Not Completed';
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
                            src={foodTypeImages[getPrimaryFoodCategory(post?.foodCategories)] || foodTypeImages['Prepared Meals']}
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
                        <div className="claimed-modal-section-header">
                            <h3 className="claimed-modal-section-title">Donation Details</h3>
                            <a 
                                href="#"
                                className="claimed-modal-chat-link"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Navigate to chat with donor
                                    navigate(`/receiver/messages?recipientEmail=${encodeURIComponent(post?.donorEmail)}`);
                                }}
                                title={`Chat with ${post?.donorName || 'donor'}`}
                            >
                                <MessageCircle size={16} />
                                <span>Chat with Donor</span>
                            </a>
                        </div>

                        <div className="claimed-modal-details-grid">
                            {/* Quantity */}
                            <div className="claimed-modal-detail-item">
                                <div className="claimed-modal-detail-icon package">
                                    <Package size={20} />
                                </div>
                                <div className="claimed-modal-detail-content">
                                    <span className="claimed-modal-detail-label">Quantity</span>
                                    <span className="claimed-modal-detail-value">
                                        {post?.quantity?.value || 0} {getUnitLabel(post?.quantity?.unit) || 'items'}
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
                                    <span className="claimed-modal-detail-value">{post?.donorName || 'Not specified'}</span>
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
                                    <span className={`claimed-modal-detail-value ${claim?.confirmedPickupSlot ? 'confirmed-pickup-time' : ''}`}>
                                        {claim?.confirmedPickupSlot ? (
                                            formatPickupTime(
                                                claim.confirmedPickupSlot.pickupDate || claim.confirmedPickupSlot.date,
                                                claim.confirmedPickupSlot.startTime || claim.confirmedPickupSlot.pickupFrom,
                                                claim.confirmedPickupSlot.endTime || claim.confirmedPickupSlot.pickupTo
                                            )
                                        ) : (
                                            formatPickupTime(post?.pickupDate, post?.pickupFrom, post?.pickupTo)
                                        )}
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
                            {(getDisplayStatus() === 'Claimed' || getDisplayStatus() === 'Ready for Pickup' || getDisplayStatus() === 'Completed') && (
                                <>
                                    <button className="claimed-modal-btn-secondary" onClick={onClose}>
                                        Back to Details
                                    </button>
                                    <button
                                        className="claimed-modal-btn-primary"
                                        onClick={handleViewPickupSteps}
                                    >
                                        View Pickup Steps
                                    </button>
                                </>
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
