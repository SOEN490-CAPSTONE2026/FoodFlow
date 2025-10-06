import React, { useState } from 'react';
import axios from 'axios';

function SurplusForm() {
  const [formData, setFormData] = useState({
    type: '',
    quantity: '',
    expiryDate: '',
    pickupTime: '',
    location: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:8080/api/surplus',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setMessage(`Success! Post created with ID: ${response.data.id}`);
      // Reset form
      setFormData({
        type: '',
        quantity: '',
        expiryDate: '',
        pickupTime: '',
        location: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create surplus post');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Create Surplus Food Post</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Food Type:</label><br />
          <input
            type="text"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Quantity:</label><br />
          <input
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Expiry Date:</label><br />
          <input
            type="datetime-local"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Pickup Time:</label><br />
          <input
            type="datetime-local"
            name="pickupTime"
            value={formData.pickupTime}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Location:</label><br />
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button 
          type="submit"
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          Submit
        </button>
      </form>

      {message && <div style={{ color: 'green', marginTop: '10px' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
    </div>
  );
}

export default SurplusForm;
