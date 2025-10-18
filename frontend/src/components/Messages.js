import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import api from '../services/api';

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [postId, setPostId] = useState('');
    const [receiverId, setReceiverId] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        connectWebSocket();
        return () => disconnectWebSocket();
    }, []);

    const connectWebSocket = () => {
        const socket = new SockJS('http://localhost:8080/ws');
        const client = Stomp.over(socket);
        
        client.connect({}, () => {
            setConnected(true);
            // Subscribe to personal message queue
            client.subscribe('/user/queue/messages', (message) => {
                const receivedMessage = JSON.parse(message.body);
                setMessages(prev => [...prev, receivedMessage]);
            });
        });
        
        setStompClient(client);
    };

    const disconnectWebSocket = () => {
        if (stompClient) {
            stompClient.disconnect();
        }
    };

    const loadMessages = async () => {
        if (!postId) return;
        try {
            const response = await api.get(`/api/messages/post/${postId}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage || !postId || !receiverId) {
            alert('Please fill all fields');
            return;
        }

        try {
            const messageData = {
                surplusPostId: parseInt(postId),
                receiverId: parseInt(receiverId),
                messageBody: newMessage
            };

            await api.post('/api/messages/send', messageData);
            setNewMessage('');
            loadMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Messages</h2>
            
            <div style={{ 
                marginBottom: '20px', 
                padding: '10px', 
                backgroundColor: connected ? '#d4edda' : '#f8d7da', 
                borderRadius: '5px',
                border: `1px solid ${connected ? '#c3e6cb' : '#f5c6cb'}`
            }}>
                Status: {connected ? 'Connected ✓' : 'Disconnected ✗'}
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                    type="number"
                    placeholder="Post ID"
                    value={postId}
                    onChange={(e) => setPostId(e.target.value)}
                    style={{ padding: '8px', flex: 1 }}
                />
                <button 
                    onClick={loadMessages} 
                    style={{ 
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Load Messages
                </button>
            </div>

            <div style={{ 
                marginBottom: '20px', 
                border: '1px solid #ccc', 
                padding: '10px', 
                minHeight: '300px', 
                maxHeight: '400px', 
                overflowY: 'auto',
                backgroundColor: '#f9f9f9',
                borderRadius: '5px'
            }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                        No messages yet. Load a conversation or send the first message!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            style={{ 
                                marginBottom: '10px', 
                                padding: '10px', 
                                backgroundColor: '#fff', 
                                borderRadius: '5px',
                                border: '1px solid #e0e0e0'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <strong style={{ color: '#007bff' }}>{msg.senderEmail}</strong>
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                    {new Date(msg.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div style={{ color: '#333' }}>{msg.messageBody}</div>
                            {!msg.readStatus && (
                                <span style={{ 
                                    fontSize: '11px', 
                                    color: '#28a745', 
                                    fontWeight: 'bold' 
                                }}>
                                    NEW
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                    type="number"
                    placeholder="Receiver User ID"
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows="3"
                    style={{ 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ccc',
                        resize: 'vertical'
                    }}
                />
                <button 
                    onClick={sendMessage}
                    style={{ 
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Send Message
                </button>
            </div>
        </div>
    );
};

export default Messages;
