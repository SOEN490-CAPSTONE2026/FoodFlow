import React, { useEffect, useState } from 'react';
import { adminImageAPI } from '../../services/api';
import './Admin_Styles/AdminImages.css';

const moderationOptions = ['PENDING', 'APPROVED', 'REJECTED', 'DISABLED'];

export default function AdminImages() {
  const [status, setStatus] = useState('PENDING');
  const [uploads, setUploads] = useState([]);
  const [library, setLibrary] = useState([]);
  const [error, setError] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [foodType, setFoodType] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const getImageUrl = imageUrl => {
    if (!imageUrl) {
      return null;
    }
    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('data:')
    ) {
      return imageUrl;
    }
    const apiBaseUrl =
      process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
    const backendBaseUrl = apiBaseUrl.endsWith('/api')
      ? apiBaseUrl.slice(0, -4)
      : apiBaseUrl.replace(/\/api$/, '');
    if (imageUrl.startsWith('/api/files/')) {
      return `${backendBaseUrl}${imageUrl}`;
    }
    return `${backendBaseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [uploadsResp, libraryResp] = await Promise.all([
          adminImageAPI.getUploads(status),
          adminImageAPI.getLibrary(false),
        ]);
        setUploads(uploadsResp.data || []);
        setLibrary(libraryResp.data || []);
      } catch (err) {
        setError('Failed to load image moderation data.');
      }
    };
    load();
  }, [status, refreshKey]);

  const moderate = async (id, nextStatus) => {
    const reason = window.prompt('Reason (optional):') || '';
    await adminImageAPI.moderateUpload(id, { status: nextStatus, reason });
    setRefreshKey(k => k + 1);
  };

  const addLibrary = async () => {
    try {
      await adminImageAPI.addLibraryItem({
        file: uploadFile,
        imageUrl,
        foodType: foodType || null,
        active: true,
      });
      setUploadFile(null);
      setImageUrl('');
      setFoodType('');
      setRefreshKey(k => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add library image.');
    }
  };

  return (
    <div className="admin-images-page">
      <div className="admin-images-header">
        <div className="admin-images-header-content">
          <div className="admin-images-eyebrow">Admin Console</div>
          <h2>Image Moderation</h2>
          <p>
            Review donor uploads, moderate visibility, and manage fallback
            library assets.
          </p>
        </div>
        <div className="admin-images-filter">
          <label htmlFor="image-status-filter">Status</label>
          <select
            id="image-status-filter"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {moderationOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="admin-images-error">{error}</div>}

      <section className="admin-images-section">
        <div className="admin-images-section-title">
          <h3>Uploaded Images</h3>
          <span className="admin-images-count-pill">
            {uploads.length} items
          </span>
        </div>
        {uploads.length === 0 ? (
          <div className="admin-images-empty-state">
            No uploads found for the selected status.
          </div>
        ) : (
          <div className="admin-images-grid">
            {uploads.map(item => (
              <article key={item.id} className="admin-image-card">
                <img
                  src={getImageUrl(item.url)}
                  alt={`Upload ${item.id}`}
                  className="admin-image-card-preview"
                />
                <div className="admin-image-card-body">
                  <div className="admin-image-card-meta">
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">ID</span>
                      <span className="admin-image-meta-value">#{item.id}</span>
                    </div>
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">Food Type</span>
                      <span className="admin-image-meta-value">
                        {item.foodType || 'GENERIC'}
                      </span>
                    </div>
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">Status</span>
                      <span
                        className={`admin-image-status admin-image-status-${(item.status || '').toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">Reason</span>
                      <span className="admin-image-meta-value">
                        {item.reason || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="admin-image-actions">
                    <button
                      type="button"
                      className="btn-action approve"
                      onClick={() => moderate(item.id, 'APPROVED')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn-action reject"
                      onClick={() => moderate(item.id, 'REJECTED')}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="btn-action disable"
                      onClick={() => moderate(item.id, 'DISABLED')}
                    >
                      Disable
                    </button>
                    <button
                      type="button"
                      className="btn-action delete"
                      onClick={async () => {
                        await adminImageAPI.deleteUpload(item.id);
                        setRefreshKey(k => k + 1);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-images-section">
        <div className="admin-images-section-title">
          <h3>Internal Image Library</h3>
          <span className="admin-images-count-pill">
            {library.length} items
          </span>
        </div>
        <div className="admin-library-toolbar">
          <div className="toolbar-file">
            <label htmlFor="library-file">Upload image</label>
            <input
              id="library-file"
              type="file"
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="toolbar-field">
            <label htmlFor="library-image-url">Or image URL</label>
            <input
              id="library-image-url"
              type="text"
              placeholder="https://..."
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
          </div>
          <div className="toolbar-field">
            <label htmlFor="library-food-type">Food type (optional)</label>
            <input
              id="library-food-type"
              type="text"
              placeholder="PRODUCE, BAKERY, ..."
              value={foodType}
              onChange={e => setFoodType(e.target.value)}
            />
          </div>
          <button type="button" className="btn-action add" onClick={addLibrary}>
            Add
          </button>
        </div>

        {library.length === 0 ? (
          <div className="admin-images-empty-state">
            Internal library is empty. Add your first fallback image.
          </div>
        ) : (
          <div className="admin-images-grid">
            {library.map(item => (
              <article key={item.id} className="admin-image-card">
                <img
                  src={getImageUrl(item.url)}
                  alt={`Library ${item.id}`}
                  className="admin-image-card-preview"
                />
                <div className="admin-image-card-body">
                  <div className="admin-image-card-meta">
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">ID</span>
                      <span className="admin-image-meta-value">#{item.id}</span>
                    </div>
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">Food Type</span>
                      <span className="admin-image-meta-value">
                        {item.foodType || 'GENERIC'}
                      </span>
                    </div>
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">Active</span>
                      <span className="admin-image-meta-value">
                        {item.active ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  <div className="admin-image-actions">
                    <button
                      type="button"
                      className="btn-action disable"
                      onClick={async () => {
                        await adminImageAPI.patchLibraryItem(
                          item.id,
                          !item.active
                        );
                        setRefreshKey(k => k + 1);
                      }}
                    >
                      {item.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="btn-action delete"
                      onClick={async () => {
                        await adminImageAPI.deleteLibraryItem(item.id);
                        setRefreshKey(k => k + 1);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
