import React, { useEffect, useState, useRef } from 'react';
import { surplusAPI } from '../services/api';

// Minimal styling inline to keep footprint tiny
const cardStyle = {
    border: '1px solid #ddd',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '10px',
    background: '#fff'
};

const SurplusFeed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState(null);
    const pollingRef = useRef(null);

    const fetchPosts = async () => {
        try {
            const { data } = await surplusAPI.list();
            setPosts(Array.isArray(data) ? data : []);
            setError(null);
        } catch (e) {
            setError('Failed to load surplus posts');
            console.error('fetchPosts error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleTestClick = async () => {
        setTestResult(null);
        setTestError(null);
        try {
            const { data } = await surplusAPI.list();
            setTestResult(data);
        } catch (e) {
            setTestError('Test fetch failed');
            console.error('handleTestClick error:', e);
        }
    };

    useEffect(() => {
        fetchPosts();
        // Simple polling every 8s (good enough for demo; can switch to WS later)
        pollingRef.current = setInterval(fetchPosts, 8000);
        return () => pollingRef.current && clearInterval(pollingRef.current);
    }, []);

    // Always render the test button and result, even if loading or error
    return (
        <div style={{ maxWidth: 760, margin: '30px auto', padding: '0 16px' }}>
            <h2 style={{ textAlign: 'left', marginBottom: 20 }}>Available Surplus</h2>
            {loading && <div data-testid="surplus-feed-loading" style={{ color: 'blue', fontWeight: 'bold' }}>Loading surplus feed...</div>}
            {error && <div role="alert" style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>}
            {!loading && !error && posts.length === 0 && <div data-testid="empty-state">No surplus items available right now.</div>}
            {!loading && !error && posts.map(p => (
                <div key={p.id} style={cardStyle} data-testid="surplus-card">
                    <strong>{p.type}</strong> <span style={{ color: '#555' }}>({p.quantity})</span>
                    <div style={{ fontSize: 14, marginTop: 6 }}>
                        <div><b>Expiry:</b> {p.expiryDate ? new Date(p.expiryDate).toLocaleString() : '—'}</div>
                        <div><b>Pickup:</b> {p.pickupTime ? new Date(p.pickupTime).toLocaleString() : '—'}</div>
                        <div><b>Location:</b> {p.location}</div>
                    </div>
                </div>
            ))}
            <button onClick={fetchPosts} style={{ marginTop: 10 }}>Refresh</button>

            {/* Minimal test button and result display, always visible */}
            <button onClick={handleTestClick} style={{ margin: '16px 0', padding: '8px 16px' }}>
                Test Surplus API
            </button>
            {testResult && (
                <pre style={{ background: '#f4f4f4', padding: '8px', borderRadius: '4px', maxHeight: 200, overflow: 'auto' }}>
          {JSON.stringify(testResult, null, 2)}
        </pre>
            )}
            {testError && <div style={{ color: 'red' }}>{testError}</div>}
        </div>
    );
};

export default SurplusFeed;