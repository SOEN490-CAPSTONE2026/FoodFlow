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

  test('shows load error when settings fetch fails', async () => {
    donorPhotoSettingsAPI.get.mockRejectedValueOnce(new Error('load failed'));
    render(<DonorPhotoPreferencesSection />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: /toggle display preferences/i,
      })
    );
    expect(
      await screen.findByText('Failed to load photo display preferences.')
    ).toBeInTheDocument();
  });

  test('shows validation error for unsupported file type', async () => {
    render(<DonorPhotoPreferencesSection />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: /toggle display preferences/i,
      })
    );

    const fileInput = await screen.findByLabelText('Single donation image');
    const badFile = new File(['bad'], 'bad.gif', { type: 'image/gif' });
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    expect(
      await screen.findByText('Only JPEG, PNG and WEBP images are allowed.')
    ).toBeInTheDocument();
    expect(imageAPI.upload).not.toHaveBeenCalled();
  });

  test('shows validation error for oversized file', async () => {
    render(<DonorPhotoPreferencesSection />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: /toggle display preferences/i,
      })
    );

    const fileInput = await screen.findByLabelText('Single donation image');
    const large = new File([new Uint8Array(6 * 1024 * 1024)], 'big.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(fileInput, { target: { files: [large] } });

    expect(
      await screen.findByText('Image must be 5MB or less.')
    ).toBeInTheDocument();
  });

  test('allows choosing a library image and saves singleLibraryImageId', async () => {
    imageLibraryAPI.list.mockResolvedValueOnce({
      data: [{ id: 11, url: '/api/files/library/11.jpg', foodType: 'GENERIC' }],
    });

    render(<DonorPhotoPreferencesSection />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: /toggle display preferences/i,
      })
    );

    const libraryBtn = document.querySelector('.donor-library-card');
    fireEvent.click(libraryBtn);
    fireEvent.click(
      screen.getByRole('button', { name: 'Save Photo Preferences' })
    );

    await waitFor(() => {
      expect(donorPhotoSettingsAPI.update).toHaveBeenCalledWith(
        expect.objectContaining({
          displayType: 'SINGLE',
          singleImageId: null,
          singleLibraryImageId: 11,
        })
      );
    });
  });

  test('handles upload API failure with clear error', async () => {
    imageAPI.upload.mockRejectedValueOnce({
      response: { data: { message: 'Upload failed from server' } },
    });
    render(<DonorPhotoPreferencesSection />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: /toggle display preferences/i,
      })
    );
    const fileInput = await screen.findByLabelText('Single donation image');
    const file = new File(['img'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      await screen.findByText('Upload failed from server')
    ).toBeInTheDocument();
  });

  test('saves per-food-type uploaded image mapping', async () => {
    donorPhotoSettingsAPI.get.mockResolvedValueOnce({
      data: {
        displayType: 'PER_FOOD_TYPE',
        perFoodTypeMap: {},
        perFoodTypeLibraryMap: {},
      },
    });
    imageAPI.upload.mockResolvedValueOnce({
      data: { image: { id: 77, url: '/api/files/donation-images/77.jpg' } },
    });

    render(<DonorPhotoPreferencesSection />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: /toggle display preferences/i,
      })
    );

    const produceInput = (await screen.findByText('PRODUCE'))
      .closest('.form-field')
      .querySelector('input[type="file"]');
    const file = new File(['img'], 'produce.jpg', { type: 'image/jpeg' });
    fireEvent.change(produceInput, { target: { files: [file] } });

    await waitFor(() => expect(imageAPI.upload).toHaveBeenCalled());
    await screen.findByText('Pending approval');
    fireEvent.click(
      screen.getByRole('button', { name: 'Save Photo Preferences' })
    );

    await waitFor(() => {
      expect(donorPhotoSettingsAPI.update).toHaveBeenCalledWith(
        expect.objectContaining({
          displayType: 'PER_FOOD_TYPE',
          perFoodTypeMap: expect.objectContaining({ PRODUCE: 77 }),
        })
      );
    });
  });
});
