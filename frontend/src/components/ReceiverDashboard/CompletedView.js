import React, { useRef, useEffect, useState } from 'react';
import { X, CircleCheck, AlertTriangle } from 'lucide-react';
import Confetti from 'react-confetti';
import { foodTypeImages, getPrimaryFoodCategory } from '../../constants/foodConstants';
import ReportUserModal from '../ReportUserModal';
import './Receiver_Styles/CompletedView.css';

const CompletedView = ({ claim, isOpen, onClose, onBack }) => {
    const post = claim?.surplusPost;
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 750, height: 800 });
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        if (containerRef.current && isOpen) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    }, [isOpen]);

    if (!isOpen || !claim) return null;

    const handleReportSubmit = async (reportData) => {
        console.log('Report submitted:', reportData);
        // Mock - will be connected to backend later
        setShowReportModal(false);
    };

    const donorInfo = post?.donor || {
        id: post?.donorId,
        name: post?.donorName || 'Donor'
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
                        src={foodTypeImages[getPrimaryFoodCategory(post?.foodCategories)] || foodTypeImages['Prepared Meals']}
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
                                Your donation has been successfully claimed! Thank you for making a difference in your community.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="claimed-modal-actions">
                        <button className="claimed-view-btn-back" onClick={onBack}>
                            Back to Details
                        </button>
                        <button 
                            className="report-donor-btn"
                            onClick={() => setShowReportModal(true)}
                        >
                            <AlertTriangle size={16} />
                            Report Donor
                        </button>
                    </div>
                </div>
            </div>

            <ReportUserModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                reportedUser={donorInfo}
                donationId={post?.id}
                onSubmit={handleReportSubmit}
            />
        </div>
    );
};

export default CompletedView;