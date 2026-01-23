import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock environment variable
process.env.REACT_APP_API_BASE_URL = 'http://localhost:8080/api';

describe('getEvidenceImageUrl helper function', () => {
  // Test the URL transformation logic
  const BACKEND_BASE_URL = 'http://localhost:8080';

  const getEvidenceImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/uploads/')) {
      const filename = url.substring('/uploads/'.length);
      return `${BACKEND_BASE_URL}/api/files/uploads/${filename}`;
    }
    if (url.startsWith('/api/files/')) {
      return `${BACKEND_BASE_URL}${url}`;
    }
    return `${BACKEND_BASE_URL}/api/files${url.startsWith('/') ? '' : '/'}${url}`;
  };

  describe('URL transformations', () => {
    it('should return null for null input', () => {
      expect(getEvidenceImageUrl(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getEvidenceImageUrl(undefined)).toBeNull();
    });

    it('should return full URL as-is for http URLs', () => {
      const fullUrl = 'http://example.com/image.jpg';
      expect(getEvidenceImageUrl(fullUrl)).toBe(fullUrl);
    });

    it('should return full URL as-is for https URLs', () => {
      const fullUrl = 'https://example.com/image.jpg';
      expect(getEvidenceImageUrl(fullUrl)).toBe(fullUrl);
    });

    it('should convert legacy /uploads/ URL to /api/files/uploads/', () => {
      const legacyUrl = '/uploads/test-uuid.jpg';
      const expected = 'http://localhost:8080/api/files/uploads/test-uuid.jpg';
      expect(getEvidenceImageUrl(legacyUrl)).toBe(expected);
    });

    it('should handle legacy URL with UUID filename', () => {
      const legacyUrl = '/uploads/550e8400-e29b-41d4-a716-446655440000.png';
      const expected = 'http://localhost:8080/api/files/uploads/550e8400-e29b-41d4-a716-446655440000.png';
      expect(getEvidenceImageUrl(legacyUrl)).toBe(expected);
    });

    it('should prepend backend base to /api/files/ URLs', () => {
      const apiUrl = '/api/files/evidence/donation-1/uuid.jpg';
      const expected = 'http://localhost:8080/api/files/evidence/donation-1/uuid.jpg';
      expect(getEvidenceImageUrl(apiUrl)).toBe(expected);
    });

    it('should handle /api/files/ URL with nested path', () => {
      const apiUrl = '/api/files/evidence/donation-123/subfolder/image.png';
      const expected = 'http://localhost:8080/api/files/evidence/donation-123/subfolder/image.png';
      expect(getEvidenceImageUrl(apiUrl)).toBe(expected);
    });

    it('should handle relative paths with fallback', () => {
      const relativePath = 'evidence/donation-1/file.jpg';
      const expected = 'http://localhost:8080/api/files/evidence/donation-1/file.jpg';
      expect(getEvidenceImageUrl(relativePath)).toBe(expected);
    });

    it('should handle relative path starting with slash', () => {
      const relativePath = '/some/other/path/file.jpg';
      const expected = 'http://localhost:8080/api/files/some/other/path/file.jpg';
      expect(getEvidenceImageUrl(relativePath)).toBe(expected);
    });
  });

  describe('File extension handling', () => {
    it('should handle .jpg extension', () => {
      const url = '/api/files/evidence/donation-1/image.jpg';
      expect(getEvidenceImageUrl(url)).toContain('.jpg');
    });

    it('should handle .jpeg extension', () => {
      const url = '/api/files/evidence/donation-1/image.jpeg';
      expect(getEvidenceImageUrl(url)).toContain('.jpeg');
    });

    it('should handle .png extension', () => {
      const url = '/api/files/evidence/donation-1/image.png';
      expect(getEvidenceImageUrl(url)).toContain('.png');
    });

    it('should handle .PNG extension (uppercase)', () => {
      const url = '/uploads/image.PNG';
      expect(getEvidenceImageUrl(url)).toContain('.PNG');
    });
  });
});

describe('Photo upload validation', () => {
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only JPEG and PNG images are allowed' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }
    return { valid: true, error: null };
  };

  it('should accept valid JPEG file', () => {
    const file = { type: 'image/jpeg', size: 1024 * 1024 }; // 1MB
    expect(validateFile(file)).toEqual({ valid: true, error: null });
  });

  it('should accept valid PNG file', () => {
    const file = { type: 'image/png', size: 1024 * 1024 }; // 1MB
    expect(validateFile(file)).toEqual({ valid: true, error: null });
  });

  it('should reject PDF file', () => {
    const file = { type: 'application/pdf', size: 1024 };
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('JPEG and PNG');
  });

  it('should reject GIF file', () => {
    const file = { type: 'image/gif', size: 1024 };
    const result = validateFile(file);
    expect(result.valid).toBe(false);
  });

  it('should reject file larger than 5MB', () => {
    const file = { type: 'image/jpeg', size: 6 * 1024 * 1024 }; // 6MB
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5MB');
  });

  it('should accept file exactly 5MB', () => {
    const file = { type: 'image/jpeg', size: 5 * 1024 * 1024 }; // 5MB
    expect(validateFile(file)).toEqual({ valid: true, error: null });
  });

  it('should accept small file', () => {
    const file = { type: 'image/png', size: 100 }; // 100 bytes
    expect(validateFile(file)).toEqual({ valid: true, error: null });
  });
});

describe('Evidence photo extraction from timeline', () => {
  const extractEvidencePhotos = (timeline) => {
    if (!timeline || !Array.isArray(timeline)) return [];
    return [...new Set(
      timeline
        .filter(event => event.pickupEvidenceUrl)
        .map(event => event.pickupEvidenceUrl)
    )];
  };

  it('should extract photos from timeline with evidence', () => {
    const timeline = [
      { eventType: 'DONATION_POSTED' },
      { eventType: 'PICKUP_EVIDENCE_UPLOADED', pickupEvidenceUrl: '/api/files/evidence/1.jpg' },
    ];
    const photos = extractEvidencePhotos(timeline);
    expect(photos).toEqual(['/api/files/evidence/1.jpg']);
  });

  it('should extract multiple photos', () => {
    const timeline = [
      { eventType: 'PICKUP_EVIDENCE_UPLOADED', pickupEvidenceUrl: '/api/files/evidence/1.jpg' },
      { eventType: 'PICKUP_EVIDENCE_UPLOADED', pickupEvidenceUrl: '/api/files/evidence/2.jpg' },
    ];
    const photos = extractEvidencePhotos(timeline);
    expect(photos).toHaveLength(2);
  });

  it('should deduplicate photos', () => {
    const timeline = [
      { eventType: 'PICKUP_EVIDENCE_UPLOADED', pickupEvidenceUrl: '/api/files/evidence/1.jpg' },
      { eventType: 'PICKUP_EVIDENCE_UPLOADED', pickupEvidenceUrl: '/api/files/evidence/1.jpg' },
    ];
    const photos = extractEvidencePhotos(timeline);
    expect(photos).toHaveLength(1);
  });

  it('should return empty array for timeline without evidence', () => {
    const timeline = [
      { eventType: 'DONATION_POSTED' },
      { eventType: 'DONATION_CLAIMED' },
    ];
    const photos = extractEvidencePhotos(timeline);
    expect(photos).toEqual([]);
  });

  it('should return empty array for null timeline', () => {
    expect(extractEvidencePhotos(null)).toEqual([]);
  });

  it('should return empty array for undefined timeline', () => {
    expect(extractEvidencePhotos(undefined)).toEqual([]);
  });

  it('should ignore events with null pickupEvidenceUrl', () => {
    const timeline = [
      { eventType: 'DONATION_POSTED', pickupEvidenceUrl: null },
      { eventType: 'PICKUP_EVIDENCE_UPLOADED', pickupEvidenceUrl: '/api/files/evidence/1.jpg' },
    ];
    const photos = extractEvidencePhotos(timeline);
    expect(photos).toHaveLength(1);
  });
});
