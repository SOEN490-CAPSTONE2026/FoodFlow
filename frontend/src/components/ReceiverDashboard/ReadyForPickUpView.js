import React, { useRef, useEffect, useState } from 'react';
import { X, CircleCheck } from 'lucide-react';
import Confetti from 'react-confetti';
import BakeryPastryImage from '../../assets/foodtypes/Pastry&Bakery.jpg';
import FruitsVeggiesImage from '../../assets/foodtypes/Fruits&Vegetables.jpg';
import PackagedPantryImage from '../../assets/foodtypes/PackagedItems.jpg';
import DairyColdImage from '../../assets/foodtypes/Dairy.jpg';
import FrozenFoodImage from '../../assets/foodtypes/FrozenFood.jpg';
import PreparedMealsImage from '../../assets/foodtypes/PreparedFood.jpg';
import './Receiver_Styles/ReadyForPickUpView.css';

const ReadyForPickUpView = ({ claim, isOpen, onClose, onBack }) => {
    const post = claim?.surplusPost;
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 750, height: 800 });

    useEffect(() => {
        if (containerRef.current && isOpen) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    }, [isOpen]);

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

    // Get pickup code(will be added soon!)
    const pickupCode = claim?.pickupCode || '060603';
    const pickupCodeArray = pickupCode.split('');


    const handleMarkAsCollected = () => {
        console.log('Marking as collected...');
    };

    return (
        <div className="claimed-modal-overlay" onClick={onClose}>
            <div
                ref={containerRef}
                className="claimed-modal-container ready-pickup-container"
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'relative' }}
            >

                {/* Close Button */}
                <button className="claimed-modal-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="claimed-modal-header">
                    <img
                        src={getFoodTypeImage(post?.foodType)}
                        alt={post?.title || 'Donation'}
                        className="claimed-modal-header-image"
                    />
                    <span className="claimed-modal-status-badge ready-pickup-badge">
                        Ready for Pickup
                    </span>
                    <div className="claimed-modal-header-overlay">
                        <h2 className="claimed-modal-title">{post?.title || 'Untitled Donation'}</h2>
                    </div>
                </div>

                {/* Body */}
                <div className="claimed-modal-body">
                    <h3 className="claimed-modal-section-title">Pickup Steps</h3>

                    {/* Step 1: Pickup Code */}
                    <div className="PickupView-ready-pickup-step">
                        <div className="PickupView-ready-pickup-step-number">1</div>
                        <div className="PickupView-ready-pickup-step-content">
                            <h4 className="PickupView-ready-pickup-step-title">Your Pickup Code</h4>
                            <p className="PickupView-ready-pickup-step-description">Show this to the donor when collecting</p>

                            <div className="PickupView-pickup-code-container">
                                <div className="PickupView-pickup-code-label">PICKUP CODE</div>
                                <div className="PickupView-pickup-code-digits">
                                    {pickupCodeArray.map((digit, index) => (
                                        <div key={index} className="pickup-code-digit">{digit}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Confirm Pickup */}
                    <div className="PickupView-ready-pickup-step">
                        <div className="PickupView-ready-pickup-step-number">2</div>
                        <div className="PickupView-ready-pickup-step-content">
                            <h4 className="PickupView-ready-pickup-step-title">Confirm Pickup</h4>
                            <p className="PickupView-ready-pickup-step-description">After collecting the food, mark this donation as collected.</p>

                            <button className="PickupView-mark-collected-btn" onClick={handleMarkAsCollected}>
                                <CircleCheck size={20} />
                                Mark as Collected
                            </button>
                        </div>
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

export default ReadyForPickUpView;