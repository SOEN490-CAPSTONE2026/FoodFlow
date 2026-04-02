import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentHistory from '../PaymentHistory';
import PaymentInvoices from '../PaymentInvoices';
import PaymentRefunds from '../PaymentRefunds';
import InvoiceViewer from '../InvoiceViewer';
import PaymentRetryNotification from '../PaymentRetryNotification';
import RefundRequestModal from '../RefundRequestModal';
import { invoiceAPI, paymentAPI, refundAPI } from '../../../services/api';

jest.mock('../../../services/api', () => ({
  paymentAPI: {
    getHistory: jest.fn(),
    getRetries: jest.fn(),
    retry: jest.fn(),
  },
  invoiceAPI: {
    generateForPayment: jest.fn(),
    getForPayment: jest.fn(),
    download: jest.fn(),
  },
  refundAPI: {
    create: jest.fn(),
    listForPayment: jest.fn(),
  },
}));

describe('Payment tools coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders payment history and refreshes data', async () => {
    paymentAPI.getHistory
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: 1,
              amount: 25,
              currency: 'USD',
              paymentType: 'ONE_TIME',
              status: 'FAILED',
              description: 'FoodFlow payment',
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { content: [] } });

    render(<PaymentHistory active />);

    expect(await screen.findByText(/25 USD/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(paymentAPI.getHistory).toHaveBeenCalledTimes(2);
    });
  });

  it('shows history errors', async () => {
    paymentAPI.getHistory.mockRejectedValueOnce({
      response: { data: { message: 'History failed' } },
    });

    render(<PaymentHistory active />);

    expect(await screen.findByText('History failed')).toBeInTheDocument();
  });

  it('renders invoices, opens the invoice panel, and handles invoice errors', async () => {
    paymentAPI.getHistory.mockResolvedValueOnce({
      data: {
        content: [{ id: 9, amount: 15, currency: 'CAD', status: 'SUCCEEDED' }],
      },
    });
    invoiceAPI.generateForPayment.mockResolvedValueOnce({});

    render(<PaymentInvoices active />);

    expect(await screen.findByText(/15 CAD/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View Invoice' }));

    await waitFor(() => {
      expect(invoiceAPI.generateForPayment).toHaveBeenCalledWith(9);
    });
    expect(
      await screen.findByRole('button', { name: 'Load Invoice' })
    ).toBeInTheDocument();
  });

  it('shows invoice loading errors', async () => {
    paymentAPI.getHistory.mockRejectedValueOnce({
      response: { data: { message: 'Invoice history failed' } },
    });

    render(<PaymentInvoices active />);

    expect(
      await screen.findByText('Invoice history failed')
    ).toBeInTheDocument();
  });

  it('shows invoice prepare errors', async () => {
    paymentAPI.getHistory.mockResolvedValueOnce({
      data: {
        content: [{ id: 5, amount: 10, currency: 'USD', status: 'SUCCEEDED' }],
      },
    });
    invoiceAPI.generateForPayment.mockRejectedValueOnce({
      response: { data: { message: 'Prepare failed' } },
    });

    render(<PaymentInvoices active />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'View Invoice' })
    );
    expect(await screen.findByText('Prepare failed')).toBeInTheDocument();
  });

  it('renders refunds and shows admin-managed refund history', async () => {
    paymentAPI.getHistory.mockResolvedValueOnce({
      data: {
        content: [{ id: 3, amount: 40, currency: 'USD', status: 'SUCCEEDED' }],
      },
    });
    refundAPI.listForPayment.mockResolvedValueOnce({
      data: [{ id: 11, amount: 5, status: 'PROCESSING', reason: 'Requested' }],
    });

    render(<PaymentRefunds active />);

    expect(await screen.findByText(/40 USD/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View Refunds' }));

    expect(await screen.findByText(/Refund History/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Refund review decisions are handled by FoodFlow admins./i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Requested/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Request Review' })
    ).not.toBeInTheDocument();
  });

  it('shows refund loading errors', async () => {
    paymentAPI.getHistory.mockRejectedValueOnce({
      response: { data: { message: 'Refund list failed' } },
    });

    render(<PaymentRefunds active />);

    expect(await screen.findByText('Refund list failed')).toBeInTheDocument();
  });

  it('shows refund history errors', async () => {
    paymentAPI.getHistory.mockResolvedValueOnce({
      data: {
        content: [{ id: 4, amount: 22, currency: 'USD', status: 'FAILED' }],
      },
    });
    refundAPI.listForPayment.mockRejectedValueOnce({
      response: { data: { message: 'Refund history failed' } },
    });

    render(<PaymentRefunds active />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'View Refunds' })
    );
    expect(
      await screen.findByText('Refund history failed')
    ).toBeInTheDocument();
  });
});

describe('InvoiceViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and downloads an invoice', async () => {
    invoiceAPI.getForPayment.mockResolvedValueOnce({
      data: {
        id: 2,
        invoiceNumber: 'INV-1',
        issuedDate: '2026-01-01',
        totalAmount: '20.00',
      },
    });
    const pdfBlob = new Blob(['pdf-data'], { type: 'application/pdf' });
    invoiceAPI.download.mockResolvedValueOnce({ data: pdfBlob });

    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;
    window.URL.createObjectURL = jest.fn(() => 'blob:test');
    window.URL.revokeObjectURL = jest.fn();
    const click = jest.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation(tagName => {
        if (tagName === 'a') {
          return { click };
        }
        return originalCreateElement(tagName);
      });

    render(<InvoiceViewer paymentId={2} />);

    fireEvent.click(screen.getByRole('button', { name: 'Load Invoice' }));
    expect(await screen.findByText('INV-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    await waitFor(() => {
      expect(invoiceAPI.download).toHaveBeenCalledWith(2);
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(pdfBlob);
    });

    createElementSpy.mockRestore();
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('shows invoice load errors', async () => {
    invoiceAPI.getForPayment.mockRejectedValueOnce({
      response: { data: { message: 'Load invoice failed' } },
    });

    render(<InvoiceViewer paymentId={2} />);

    fireEvent.click(screen.getByRole('button', { name: 'Load Invoice' }));
    expect(await screen.findByText('Load invoice failed')).toBeInTheDocument();
  });

  it('shows invoice download errors', async () => {
    invoiceAPI.getForPayment.mockResolvedValueOnce({
      data: {
        id: 2,
        invoiceNumber: 'INV-1',
        issuedDate: '2026-01-01',
        totalAmount: '20.00',
      },
    });
    invoiceAPI.download.mockRejectedValueOnce({
      response: { data: { message: 'Download failed' } },
    });

    render(<InvoiceViewer paymentId={2} />);

    fireEvent.click(screen.getByRole('button', { name: 'Load Invoice' }));
    expect(await screen.findByText('INV-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(await screen.findByText('Download failed')).toBeInTheDocument();
  });
});

describe('PaymentRetryNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render for non-failed payments', () => {
    const { container } = render(
      <PaymentRetryNotification
        payment={{ id: 1, status: 'SUCCEEDED' }}
        onRetried={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('loads retry details and retries a failed payment', async () => {
    const onRetried = jest.fn();
    paymentAPI.getRetries.mockResolvedValueOnce({
      data: [{ attemptNumber: 2, status: 'FAILED' }],
    });
    paymentAPI.retry.mockResolvedValueOnce({ data: { id: 7 } });

    render(
      <PaymentRetryNotification
        payment={{ id: 7, status: 'FAILED' }}
        onRetried={onRetried}
      />
    );

    expect(await screen.findByText(/Attempt 2 is failed/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry Payment' }));

    await waitFor(() => {
      expect(paymentAPI.retry).toHaveBeenCalledWith(7);
    });
    expect(onRetried).toHaveBeenCalledWith({ id: 7 });
  });

  it('shows retry loading errors', async () => {
    paymentAPI.getRetries.mockRejectedValueOnce({
      response: { data: { message: 'Retry load failed' } },
    });

    render(
      <PaymentRetryNotification
        payment={{ id: 8, status: 'FAILED' }}
        onRetried={jest.fn()}
      />
    );

    expect(await screen.findByText('Retry load failed')).toBeInTheDocument();
  });

  it('shows retry action errors', async () => {
    paymentAPI.getRetries.mockResolvedValueOnce({ data: [] });
    paymentAPI.retry.mockRejectedValueOnce({
      response: { data: { message: 'Retry action failed' } },
    });

    render(
      <PaymentRetryNotification
        payment={{ id: 9, status: 'FAILED' }}
        onRetried={jest.fn()}
      />
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'Retry Payment' })
    );
    expect(await screen.findByText('Retry action failed')).toBeInTheDocument();
  });
});

describe('RefundRequestModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null without a payment', () => {
    const { container } = render(
      <RefundRequestModal
        payment={null}
        onClose={jest.fn()}
        onSubmitted={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('submits a refund request successfully', async () => {
    const onClose = jest.fn();
    const onSubmitted = jest.fn();
    refundAPI.create.mockResolvedValueOnce({});

    render(
      <RefundRequestModal
        payment={{ id: 15, amount: '12.50' }}
        onClose={onClose}
        onSubmitted={onSubmitted}
      />
    );

    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '8.25' },
    });
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Duplicate charge' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Submit for Approval' })
    );

    await waitFor(() => {
      expect(refundAPI.create).toHaveBeenCalledWith({
        paymentId: 15,
        amount: 8.25,
        reason: 'Duplicate charge',
      });
    });
    expect(onSubmitted).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        /Refund request submitted. A FoodFlow admin must approve it before any money is returned and the invoice is updated./i
      )
    ).toBeInTheDocument();
  });

  it('shows refund submission errors', async () => {
    refundAPI.create.mockRejectedValueOnce({
      response: { data: { message: 'Refund submit failed' } },
    });

    render(
      <RefundRequestModal
        payment={{ id: 20, amount: '10.00' }}
        onClose={jest.fn()}
        onSubmitted={jest.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Submit for Approval' })
    );
    expect(await screen.findByText('Refund submit failed')).toBeInTheDocument();
  });
});
