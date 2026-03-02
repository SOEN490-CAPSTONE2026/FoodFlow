import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DonorPhotoPreferencesSection from '../DonorPhotoPreferencesSection';

jest.mock('../../../services/api', () => ({
  donorPhotoSettingsAPI: {
    get: jest.fn(),
    update: jest.fn(),
  },
  imageAPI: {
    upload: jest.fn(),
  },
  imageLibraryAPI: {
    list: jest.fn(),
  },
}));

const {
  donorPhotoSettingsAPI,
  imageAPI,
  imageLibraryAPI,
} = require('../../../services/api');

describe('DonorPhotoPreferencesSection', () => {
  beforeEach(() => {
    donorPhotoSettingsAPI.get.mockResolvedValue({
      data: {
        displayType: 'SINGLE',
        perFoodTypeMap: {},
        perFoodTypeLibraryMap: {},
      },
    });
    donorPhotoSettingsAPI.update.mockResolvedValue({
      data: {
        displayType: 'PER_FOOD_TYPE',
        perFoodTypeMap: {},
        perFoodTypeLibraryMap: {},
      },
    });
    imageLibraryAPI.list.mockResolvedValue({ data: [] });
    imageAPI.upload.mockResolvedValue({
      data: {
        image: {
          id: 55,
          url: '/api/files/donation-images/55.jpg',
        },
      },
    });
  });

  test('toggles display type and saves preferences', async () => {
    render(<DonorPhotoPreferencesSection />);

    await waitFor(() => {
      expect(donorPhotoSettingsAPI.get).toHaveBeenCalled();
    });

    fireEvent.click(
      await screen.findByRole('button', {
        name: /toggle display preferences/i,
      })
    );
    fireEvent.click(await screen.findByLabelText('Photo per food type'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Save Photo Preferences' })
    );

    await waitFor(() => {
      expect(donorPhotoSettingsAPI.update).toHaveBeenCalledWith(
        expect.objectContaining({ displayType: 'PER_FOOD_TYPE' })
      );
    });
  });

  test('uploads single image through API', async () => {
    render(<DonorPhotoPreferencesSection />);
    await waitFor(() => {
      expect(donorPhotoSettingsAPI.get).toHaveBeenCalled();
    });

    fireEvent.click(
      await screen.findByRole('button', {
        name: /toggle display preferences/i,
      })
    );
    const fileInput = await screen.findByLabelText('Single donation image');
    const file = new File(['img'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(imageAPI.upload).toHaveBeenCalled();
    });
  });
});
