import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentMethodForm from '../PaymentMethodForm';
import { paymentAPI } from '../../../services/api';

const mockConfirmSetup = jest.fn();

jest.mock('../../../services/api', () => ({
  paymentAPI: {
    createMethodSetupIntent: jest.fn(),
    attachMethod: jest.fn(),
  },
}));

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div data-testid="elements">{children}</div>,
  PaymentElement: () => (
    <div data-testid="payment-element">Payment Element</div>
  ),
  useStripe: () => ({
    confirmSetup: mockConfirmSetup,
  }),
  useElements: () => ({}),
}));

describe('PaymentMethodForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while setup intent is loading', () => {
    paymentAPI.createMethodSetupIntent.mockReturnValue(new Promise(() => {}));
    render(<PaymentMethodForm onSaved={jest.fn()} onCancel={jest.fn()} />);

    expect(screen.getByText(/Preparing secure setup/i)).toBeInTheDocument();
  });

  it('shows an error when setup intent creation fails', async () => {
    paymentAPI.createMethodSetupIntent.mockRejectedValueOnce({
      response: { data: { message: 'Setup failed' } },
    });

    render(<PaymentMethodForm onSaved={jest.fn()} onCancel={jest.fn()} />);

    expect(await screen.findByText('Setup failed')).toBeInTheDocument();
  });

  it('shows a missing setup intent error when no client secret is returned', async () => {
    paymentAPI.createMethodSetupIntent.mockResolvedValueOnce({ data: {} });

    render(<PaymentMethodForm onSaved={jest.fn()} onCancel={jest.fn()} />);

    expect(
      await screen.findByText(/Missing setup intent/i)
    ).toBeInTheDocument();
  });

  it('saves a payment method successfully', async () => {
    const onSaved = jest.fn();
    paymentAPI.createMethodSetupIntent.mockResolvedValueOnce({
      data: { clientSecret: 'seti_secret' },
    });
    mockConfirmSetup.mockResolvedValueOnce({
      setupIntent: { payment_method: 'pm_123' },
    });
    paymentAPI.attachMethod.mockResolvedValueOnce({});

    render(<PaymentMethodForm onSaved={onSaved} onCancel={jest.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Save Method' }));

    await waitFor(() => {
      expect(paymentAPI.attachMethod).toHaveBeenCalledWith({
        paymentMethodId: 'pm_123',
        setAsDefault: true,
      });
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows stripe validation errors from confirmSetup', async () => {
    paymentAPI.createMethodSetupIntent.mockResolvedValueOnce({
      data: { clientSecret: 'seti_secret' },
    });
    mockConfirmSetup.mockResolvedValueOnce({
      error: { message: 'Card setup failed' },
    });

    render(<PaymentMethodForm onSaved={jest.fn()} onCancel={jest.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Save Method' }));

    expect(await screen.findByText('Card setup failed')).toBeInTheDocument();
  });

  it('shows an error when Stripe does not return a payment method', async () => {
    paymentAPI.createMethodSetupIntent.mockResolvedValueOnce({
      data: { clientSecret: 'seti_secret' },
    });
    mockConfirmSetup.mockResolvedValueOnce({
      setupIntent: {},
    });

    render(<PaymentMethodForm onSaved={jest.fn()} onCancel={jest.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Save Method' }));

    expect(
      await screen.findByText(/Stripe did not return a payment method/i)
    ).toBeInTheDocument();
  });

  it('shows API errors when attach fails', async () => {
    paymentAPI.createMethodSetupIntent.mockResolvedValueOnce({
      data: { clientSecret: 'seti_secret' },
    });
    mockConfirmSetup.mockResolvedValueOnce({
      setupIntent: { payment_method: 'pm_123' },
    });
    paymentAPI.attachMethod.mockRejectedValueOnce({
      response: { data: { message: 'Attach failed' } },
    });

    render(<PaymentMethodForm onSaved={jest.fn()} onCancel={jest.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Save Method' }));

    expect(await screen.findByText('Attach failed')).toBeInTheDocument();
  });
});
