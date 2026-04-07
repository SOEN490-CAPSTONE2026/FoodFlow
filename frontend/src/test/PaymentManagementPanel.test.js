import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentManagementPanel from '../components/Payment/PaymentManagementPanel';

jest.mock('../components/Payment/PaymentMethodManager', () => () => (
  <div>Payment Method Manager</div>
));
jest.mock('../components/Payment/PaymentHistory', () => () => (
  <div>Payment History</div>
));
jest.mock('../components/Payment/PaymentInvoices', () => () => (
  <div>Payment Invoices</div>
));
jest.mock('../components/Payment/PaymentRefunds', () => () => (
  <div>Payment Refunds</div>
));

describe('PaymentManagementPanel', () => {
  test('opens the tools and shows methods by default', () => {
    render(<PaymentManagementPanel />);

    expect(screen.getByText('Billing Tools')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Tools' }));

    expect(
      screen.getByRole('tablist', { name: 'Billing tools' })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Methods' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('Payment Method Manager')).toBeInTheDocument();
  });

  test('switches tabs and closes again', () => {
    render(<PaymentManagementPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Tools' }));
    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    expect(screen.getByText('Payment History')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Invoices' }));
    expect(screen.getByText('Payment Invoices')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Refunds' }));
    expect(screen.getByText('Payment Refunds')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide Tools' }));
    expect(screen.queryByText('Payment Refunds')).not.toBeInTheDocument();
  });
});
