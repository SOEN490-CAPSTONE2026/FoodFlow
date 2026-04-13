import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentMethodManager from '../components/Payment/PaymentMethodManager';
import { paymentAPI } from '../services/api';

jest.mock('../services/api', () => ({
  paymentAPI: {
    listMethods: jest.fn(),
    setDefaultMethod: jest.fn(),
    detachMethod: jest.fn(),
  },
}));

jest.mock('../components/Payment/PaymentMethodForm', () => {
  return function MockPaymentMethodForm({ onSaved, onCancel }) {
    return (
      <div>
        <button onClick={onSaved}>Mock Save</button>
        <button onClick={onCancel}>Mock Cancel</button>
      </div>
    );
  };
});

describe('PaymentMethodManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and renders saved payment methods', async () => {
    paymentAPI.listMethods.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          paymentMethodType: 'CARD',
          cardBrand: 'visa',
          cardLast4: '4242',
          isDefault: true,
        },
      ],
    });

    render(<PaymentMethodManager active />);

    expect(screen.getByText(/Loading saved methods/i)).toBeInTheDocument();
    expect(await screen.findByText(/visa ending in 4242/i)).toBeInTheDocument();
    expect(screen.getByText(/Default method/i)).toBeInTheDocument();
  });

  it('shows an error when loading fails', async () => {
    paymentAPI.listMethods.mockRejectedValueOnce({
      response: { data: { message: 'Cannot load methods' } },
    });

    render(<PaymentMethodManager active />);

    expect(await screen.findByText('Cannot load methods')).toBeInTheDocument();
  });

  it('opens and closes the add method form', async () => {
    paymentAPI.listMethods.mockResolvedValue({ data: [] });
    render(<PaymentMethodManager active />);

    fireEvent.click(await screen.findByRole('button', { name: 'Add Method' }));
    expect(
      screen.getByRole('button', { name: 'Mock Save' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mock Cancel' }));
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Mock Save' })
      ).not.toBeInTheDocument();
    });
  });

  it('sets a method as default and reloads the list', async () => {
    paymentAPI.listMethods
      .mockResolvedValueOnce({
        data: [
          {
            id: 2,
            paymentMethodType: 'CARD',
            cardBrand: 'mastercard',
            cardLast4: '1111',
            isDefault: false,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 2,
            paymentMethodType: 'CARD',
            cardBrand: 'mastercard',
            cardLast4: '1111',
            isDefault: true,
          },
        ],
      });
    paymentAPI.setDefaultMethod.mockResolvedValue({});

    render(<PaymentMethodManager active />);

    fireEvent.click(await screen.findByRole('button', { name: 'Set Default' }));

    await waitFor(() => {
      expect(paymentAPI.setDefaultMethod).toHaveBeenCalledWith(2);
    });
    expect(await screen.findByText(/Default method/i)).toBeInTheDocument();
  });

  it('removes a method and reloads the list', async () => {
    paymentAPI.listMethods
      .mockResolvedValueOnce({
        data: [
          {
            id: 3,
            paymentMethodType: 'ACH_DEBIT',
            bankName: 'Chase',
            bankLast4: '6789',
            isDefault: false,
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] });
    paymentAPI.detachMethod.mockResolvedValue({});

    render(<PaymentMethodManager active />);

    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(paymentAPI.detachMethod).toHaveBeenCalledWith(3);
    });
    expect(
      await screen.findByText(/No saved payment methods yet/i)
    ).toBeInTheDocument();
  });
});
