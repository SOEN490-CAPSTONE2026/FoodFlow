import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Receiver_Styles/ReceiverMyClaims.css';
import { claimsAPI } from '../../services/api';

const ReceiverMyClaims = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyClaims();
    }, []);

    const fetchMyClaims = async () => {
        try {
            const response = await claimsAPI.myClaims();
            setClaims(response.data);
        } catch (error) {
            console.error('Error fetching claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClaim = async (claimId) => {
        if (!window.confirm('Are you sure you want to cancel this claim?')) {
            return;
        }

        try {
            await claimsAPI.cancel(claimId);
            alert('Claim cancelled successfully');
            fetchMyClaims(); // Refresh list
        } catch (error) {
            console.error('Error cancelling claim:', error);
            alert('Failed to cancel claim');
        }
    };

    if (loading) {
        return <div className="loading">Loading your claims...</div>;
    }

    return (
        <div className="my-claims-container">
            <h2>My Claims</h2>
            
            {claims.length === 0 ? (
                <div className="no-claims">
                    <p>You haven't claimed any donations yet.</p>
                    <p>Browse available donations to make your first claim!</p>
                </div>
            ) : (
                <div className="claims-grid">
                    {claims.map((claim) => (
                        <div key={claim.id} className="claim-card">
                            <div className="claim-header">
                                <h3>{claim.surplusPost.title}</h3>
                                <span className="claim-status">{claim.status}</span>
                            </div>
                            
                            <div className="claim-details">
                                <p><strong>Donor:</strong> {claim.surplusPost.donorEmail}</p>
                                <p><strong>Quantity:</strong> {claim.surplusPost.quantity?.value || 0} {claim.surplusPost.quantity?.unit || 'items'}</p>
                                <p><strong>Location:</strong> {claim.surplusPost.pickupLocation?.address || 'Not specified'}</p>
                                <p><strong>Pickup Date:</strong> {claim.surplusPost.pickupDate}</p>
                                <p><strong>Pickup Time:</strong> {claim.surplusPost.pickupFrom} - {claim.surplusPost.pickupTo}</p>
                                <p><strong>Claimed On:</strong> {new Date(claim.claimedAt).toLocaleString()}</p>
                            </div>
                            
                            <div className="claim-description">
                                <p>{claim.surplusPost.description}</p>
                            </div>
                            
                            <div className="claim-actions">
                                <button 
                                    onClick={() => handleCancelClaim(claim.id)}
                                    className="cancel-button"
                                >
                                    Cancel Claim
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReceiverMyClaims;
