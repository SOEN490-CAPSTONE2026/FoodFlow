import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const MyPosts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyPosts();
    }, []);

    const fetchMyPosts = async () => {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) {
                setError('No authentication token found');
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:8080/api/surplus/my-posts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            } else {
                setError(`Failed to fetch posts: ${response.status} ${response.statusText}`);
            }
        } catch (err) {
            setError(`Error fetching posts: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading your posts...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <h2 style={styles.title}>My Posts</h2>
                <div style={styles.error}>Error: {error}</div>
                <button style={styles.backButton} onClick={handleBackToDashboard}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>My Surplus Posts</h2>
            <button style={styles.backButton} onClick={handleBackToDashboard}>
                Back to Dashboard
            </button>
            
            {posts.length === 0 ? (
                <div style={styles.noPosts}>
                    <p>You haven't created any surplus posts yet.</p>
                </div>
            ) : (
                <div style={styles.postsGrid}>
                    {posts.map((post, index) => (
                        <div key={post.id} style={styles.postBox}>
                            <h3 style={styles.postTitle}>Post #{post.id}</h3>
                            <div style={styles.jsonContainer}>
                                <pre style={styles.jsonContent}>
                                    {JSON.stringify(post, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div style={styles.summary}>
                <p><strong>Total Posts: {posts.length}</strong></p>
                <p><small>Note: Only your posts are displayed here.</small></p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif'
    },
    title: {
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: '20px'
    },
    backButton: {
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        marginBottom: '20px',
        fontSize: '16px'
    },
    loading: {
        textAlign: 'center',
        fontSize: '18px',
        color: '#7f8c8d',
        padding: '50px'
    },
    error: {
        backgroundColor: '#e74c3c',
        color: 'white',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px',
        textAlign: 'center'
    },
    noPosts: {
        textAlign: 'center',
        padding: '50px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        color: '#6c757d'
    },
    postsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    postBox: {
        border: '2px solid #3498db',
        borderRadius: '10px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    },
    postTitle: {
        color: '#2c3e50',
        marginTop: '0',
        marginBottom: '15px',
        textAlign: 'center',
        backgroundColor: '#3498db',
        color: 'white',
        padding: '10px',
        borderRadius: '5px'
    },
    jsonContainer: {
        backgroundColor: '#2c3e50',
        borderRadius: '5px',
        padding: '15px',
        overflow: 'auto',
        maxHeight: '300px'
    },
    jsonContent: {
        color: '#ecf0f1',
        fontSize: '12px',
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    },
    summary: {
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#e8f5e8',
        borderRadius: '10px',
        border: '1px solid #27ae60'
    }
};

export default MyPosts;
