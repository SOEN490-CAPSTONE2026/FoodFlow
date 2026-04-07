import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminImages from '../components/AdminDashboard/AdminImages';

jest.mock('../services/api', () => ({
  adminImageAPI: {
    getUploads: jest.fn(),
    getLibrary: jest.fn(),
    moderateUpload: jest.fn(),
    deleteUpload: jest.fn(),
    addLibraryItem: jest.fn(),
    patchLibraryItem: jest.fn(),
    deleteLibraryItem: jest.fn(),
  },
}));

const { adminImageAPI } = require('../../../services/api');

describe('AdminImages', () => {
  beforeEach(() => {
    adminImageAPI.getUploads.mockResolvedValue({
      data: [
        {
          id: 1,
          url: 'https://example.com/upload.jpg',
          status: 'PENDING',
          foodType: 'PRODUCE',
        },
      ],
    });
    adminImageAPI.getLibrary.mockResolvedValue({
      data: [
        {
          id: 11,
          url: 'https://example.com/library.jpg',
          active: true,
          foodType: null,
        },
      ],
    });
    adminImageAPI.moderateUpload.mockResolvedValue({ data: {} });
    adminImageAPI.deleteUpload.mockResolvedValue({ data: {} });
    adminImageAPI.patchLibraryItem.mockResolvedValue({ data: {} });
    adminImageAPI.deleteLibraryItem.mockResolvedValue({ data: {} });
    adminImageAPI.addLibraryItem.mockResolvedValue({ data: {} });
    window.prompt = jest.fn(() => 'ok');
  });

  test('approve action calls moderation API', async () => {
    render(<AdminImages />);
    await waitFor(() => {
      expect(adminImageAPI.getUploads).toHaveBeenCalled();
    });

    fireEvent.click(await screen.findByText('Approve'));
    await waitFor(() => {
      expect(adminImageAPI.moderateUpload).toHaveBeenCalledWith(1, {
        status: 'APPROVED',
      });
    });
    expect(window.prompt).not.toHaveBeenCalled();
  });

  test('requires food type before adding library item', async () => {
    render(<AdminImages />);
    await waitFor(() => {
      expect(adminImageAPI.getLibrary).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(
      screen.getByText('Please select a food type category.')
    ).toBeInTheDocument();
    expect(adminImageAPI.addLibraryItem).not.toHaveBeenCalled();
  });
});
