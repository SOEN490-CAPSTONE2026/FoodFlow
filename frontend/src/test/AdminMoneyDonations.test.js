import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminMoneyDonations from '../components/AdminDashboard/AdminMoneyDonations';
import { adminPaymentAPI } from '../services/api';

jest.mock('../services/api', () => ({
  adminPaymentAPI: {
    getTransactions: jest.fn(),
    getSummary: jest.fn(),
    createRefundRequest: jest.fn(),
    approveRefund: jest.fn(),
    rejectRefund: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const map = {
        'adminPayments.eyebrow': 'Admin Finance',
        'adminPayments.title': 'Money Donation Transactions',
        'adminPayments.description': 'Track money donations',
        'adminPayments.loading': 'Loading payment transactions...',
        'adminPayments.actions.refresh': 'Refresh',
        'adminPayments.actions.reset': 'Reset filters',
        'adminPayments.actions.createRefundRequest': 'Create refund request',
        'adminPayments.actions.saving': 'Saving...',
        'adminPayments.actions.approveRefund': 'Approve refund',
        'adminPayments.actions.rejectRefund': 'Reject refund',
        'adminPayments.actions.previous': 'Previous',
        'adminPayments.actions.next': 'Next',
        'adminPayments.kpis.totalVolume': 'Total volume',
        'adminPayments.kpis.successfulTransactions': 'Successful transactions',
        'adminPayments.kpis.pendingRefundRequests': 'Pending refund requests',
        'adminPayments.kpis.netVolume': 'Net collected volume',
        'adminPayments.filters.search': 'Search',
        'adminPayments.filters.searchPlaceholder':
          'Search by transaction ID, organization, Stripe intent...',
        'adminPayments.filters.paymentStatus': 'Payment status',
        'adminPayments.filters.refundStatus': 'Refund status',
        'adminPayments.filters.currency': 'Currency',
        'adminPayments.filters.fromDate': 'From date',
        'adminPayments.filters.toDate': 'To date',
        'adminPayments.filters.all': 'All',
        'adminPayments.filters.allCurrencies': 'All currencies',
        'adminPayments.columns.transaction': 'Transaction',
        'adminPayments.columns.organization': 'Organization',
        'adminPayments.columns.gross': 'Gross amount',
        'adminPayments.columns.refunded': 'Refunded amount',
        'adminPayments.columns.net': 'Net amount',
        'adminPayments.columns.invoice': 'Invoice',
        'adminPayments.columns.paymentStatus': 'Payment status',
        'adminPayments.columns.createdAt': 'Created',
        'adminPayments.columns.currency': 'Currency',
        'adminPayments.columns.invoiceStatus': 'Invoice status',
        'adminPayments.details.transaction': 'Transaction details',
        'adminPayments.refunds.title': 'Refund requests',
        'adminPayments.refunds.createTitle': 'Create refund request',
        'adminPayments.refunds.amount': 'Refund amount',
        'adminPayments.refunds.reason': 'Refund reason',
        'adminPayments.refunds.empty':
          'No refund activity on this transaction.',
        'adminPayments.refunds.requestedBy': 'Requested by',
        'adminPayments.refunds.adminNotes': 'Admin notes',
        'adminPayments.refunds.notesPlaceholder':
          'Add internal notes before approving or rejecting this refund.',
        'adminPayments.refunds.noReason': 'No reason provided',
        'adminPayments.invoiceMissing': 'No invoice yet',
        'adminPayments.refundLabel': 'Refund',
        'adminPayments.noDescription': 'No description provided',
        'adminPayments.errors.amountRequired': 'Amount is required.',
      };
      if (key === 'adminPayments.transactionId') {
        return `Transaction #${params.id}`;
      }
      if (key === 'adminPayments.refunds.pendingCount') {
        return `${params.count} pending review`;
      }
      if (key === 'adminPayments.pagination') {
        return `Page ${params.current} of ${params.total}`;
      }
      return map[key] || key;
    },
  }),
}));

describe('AdminMoneyDonations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminPaymentAPI.getTransactions.mockResolvedValue({
      data: {
        content: [
          {
            id: 11,
            organizationName: 'Helping Hands',
            description: 'FoodFlow Donation',
            amount: 50,
            currency: 'USD',
            status: 'SUCCEEDED',
            refundedAmount: 10,
            netAmount: 40,
            invoiceNumber: 'INV-200',
            invoiceStatus: 'PAID',
            createdAt: '2026-04-01T12:00:00',
            pendingRefundCount: 1,
            latestRefundStatus: 'PENDING',
            refunds: [
              {
                id: 81,
                amount: 10,
                status: 'PENDING',
                reason: 'Duplicate charge',
                requestedByName: 'org@example.com',
                createdAt: '2026-04-01T13:00:00',
              },
            ],
          },
        ],
        totalPages: 1,
      },
    });
    adminPaymentAPI.getSummary.mockResolvedValue({
      data: {
        totalVolume: 50,
        successfulTransactions: 1,
        pendingRefundRequests: 1,
        netVolume: 40,
      },
    });
  });

  it('loads and renders the transaction list with KPIs', async () => {
    render(<AdminMoneyDonations />);

    expect(
      await screen.findByText('Money Donation Transactions')
    ).toBeInTheDocument();
    expect(screen.getByText('Helping Hands')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'INV-200' })).toBeInTheDocument();
    expect(screen.getByText('Pending refund requests')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('creates a refund request from the expanded transaction', async () => {
    adminPaymentAPI.createRefundRequest.mockResolvedValue({});

    render(<AdminMoneyDonations />);

    fireEvent.click(await screen.findByText('#11'));
    fireEvent.change(screen.getByLabelText('Refund amount'), {
      target: { value: '6.50' },
    });
    fireEvent.change(screen.getByLabelText('Refund reason'), {
      target: { value: 'Partial goodwill refund' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Create refund request' })
    );

    await waitFor(() => {
      expect(adminPaymentAPI.createRefundRequest).toHaveBeenCalledWith(11, {
        amount: 6.5,
        reason: 'Partial goodwill refund',
      });
    });
  });

  it('approves a pending refund request', async () => {
    adminPaymentAPI.approveRefund.mockResolvedValue({});

    render(<AdminMoneyDonations />);

    fireEvent.click(await screen.findByText('#11'));
    fireEvent.change(
      screen.getByPlaceholderText(
        'Add internal notes before approving or rejecting this refund.'
      ),
      { target: { value: 'Approved by admin' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Approve refund' }));

    await waitFor(() => {
      expect(adminPaymentAPI.approveRefund).toHaveBeenCalledWith(
        81,
        'Approved by admin'
      );
    });
  });
});
