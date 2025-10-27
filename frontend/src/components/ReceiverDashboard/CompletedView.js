import React, { useRef, useEffect, useState } from 'react';
import { X, CircleCheck } from 'lucide-react';
import Confetti from 'react-confetti';
import BakeryPastryImage from '../../assets/foodtypes/Pastry&Bakery.jpg';
import FruitsVeggiesImage from '../../assets/foodtypes/Fruits&Vegetables.jpg';
import PackagedPantryImage from '../../assets/foodtypes/PackagedItems.jpg';
import DairyColdImage from '../../assets/foodtypes/Dairy.jpg';
import FrozenFoodImage from '../../assets/foodtypes/FrozenFood.jpg';
import PreparedMealsImage from '../../assets/foodtypes/PreparedFood.jpg';
import './Receiver_Styles/CompletedView.css';

const CompletedView = ({ claim, isOpen, onClose, onBack }) => {
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

    return (
        <div className="claimed-modal-overlay" onClick={onClose}>
            <div
                ref={containerRef}
                className="claimed-modal-container"
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'relative' }}
            >
                {/* Confetti inside modal */}
                <Confetti
                    width={dimensions.width}
                    height={dimensions.height}
                    recycle={false}
                    numberOfPieces={200}
                    gravity={0.3}
                    colors={['#0092B8', '#A2F4FD', '#1B4965', '#ECFEFF', '#62E9F7']}
                    style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }}
                />

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

                    {/* Content */}
                    <div className="CompletedView-pickup-step">
                        <div className="CompletedView-pickup-step-icon">
                            <CircleCheck size={48} color='#0092B8' />
                        </div>
                        <div className="CompletedView-pickup-step-content">
                            <h4 className="CompletedView-pickup-step-title">Donation Claimed! </h4>
                            <p className="CompletedView-pickup-step-description">
                                Your claim is confirmed. Wait for the pickup window to start, and your pickup code will be available!
                            </p>
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

export default CompletedView;