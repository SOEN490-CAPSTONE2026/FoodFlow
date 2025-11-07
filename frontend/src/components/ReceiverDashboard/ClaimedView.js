import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import BakeryPastryImage from '../../assets/foodtypes/Pastry&Bakery.jpg';
import FruitsVeggiesImage from '../../assets/foodtypes/Fruits&Vegetables.jpg';
import PackagedPantryImage from '../../assets/foodtypes/PackagedItems.jpg';
import DairyColdImage from '../../assets/foodtypes/Dairy.jpg';
import FrozenFoodImage from '../../assets/foodtypes/FrozenFood.jpg';
import PreparedMealsImage from '../../assets/foodtypes/PreparedFood.jpg';
import './Receiver_Styles/ClaimedView.css';

const ClaimedView = ({ claim, isOpen, onClose, onBack }) => {
    const post = claim?.surplusPost;

    if (!isOpen || !claim) return null;

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

    return (
        <div className="claimed-modal-overlay" onClick={onClose}>
            <div className="claimed-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="claimed-modal-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                {/* Header with Image */}
                <div className="claimed-modal-header">
                    <img
                        src={getFoodTypeImage(post?.foodType)}
                        alt={post?.title || 'Donation'}
                        className="claimed-modal-header-image"
                    />
                    <span className="claimed-modal-status-badge claimed-status-claimed">
                        Claimed
                    </span>
                    <div className="claimed-modal-header-overlay">
                        <h2 className="claimed-modal-title">{post?.title || 'Untitled Donation'}</h2>
                    </div>
                </div>

                {/* Body */}
                <div className="claimed-modal-body">
                    <h3 className="claimed-modal-section-title">Pickup Steps</h3>

                    {/* Step 1 */}
                    <div className="pickup-step">
                        <div className="pickup-step-number">1</div>
                        <div className="pickup-step-content">
                            <h4 className="pickup-step-title">Review pickup time and location</h4>
                            <p className="pickup-step-description">
                                Be on time to ensure your organization receives this donation.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="pickup-step-placeholder">
                        <div className="pickup-step-number-placeholder">2</div>
                        <div className="pickup-step-content">
                            <h4 className="pickup-step-title">Wait for the pickup window to start</h4>
                            <p className="pickup-step-description">
                                Once it starts, your pickup code will appear here.
                            </p>
                            <div className="pickup-code-placeholder">
                                <div className="pickup-dots">
                                    <span className="dot-1">•</span>
                                    <span className="dot-2">•</span>
                                    <span className="dot-3">•</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="pickup-step-placeholder">
                        <div className="pickup-step-number-placeholder">3</div>
                        <div className="pickup-step-content">
                            <h4 className="pickup-step-title">Arrival Confirmation</h4>
                            <p className="pickup-step-description">
                                Make sure to arrive on time and send a quick text to the donor to confirm you're on your way!
                            </p>
                            <div className="pickup-code-placeholder">
                                <div className="pickup-dots">
                                    <span className="dot-1">•</span>
                                    <span className="dot-2">•</span>
                                    <span className="dot-3">•</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="pickup-info-box">
                        Pickup code will unlock when it's time
                    </div>

                    {/* Action Buttons */}
                    <div className="claimed-modal-actions">
                        <button className="claimed-view-btn-back" onClick={onBack}>
                            Back to Details
                        </button>
                        <button className="claimed-view-btn-view">
                            View Pickup Steps
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClaimedView;