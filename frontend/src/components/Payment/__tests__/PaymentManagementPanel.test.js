import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentManagementPanel from '../PaymentManagementPanel';

jest.mock('../PaymentMethodManager', () => props => (
  <div data-testid="payment-method-manager">
    Methods {props.active ? 'active' : 'inactive'}
  </div>
));

jest.mock('../PaymentHistory', () => props => (
  <div data-testid="payment-history">
    History {props.active ? 'active' : 'inactive'}
  </div>
));

jest.mock('../PaymentInvoices', () => props => (
  <div data-testid="payment-invoices">
    Invoices {props.active ? 'active' : 'inactive'}
  </div>
));

jest.mock('../PaymentRefunds', () => props => (
  <div data-testid="payment-refunds">
    Refunds {props.active ? 'active' : 'inactive'}
  </div>
));

describe('PaymentManagementPanel', () => {
  test('opens tools and switches between tabs', () => {
    render(<PaymentManagementPanel />);

    expect(
      screen.queryByTestId('payment-method-manager')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Tools' }));

    expect(screen.getByRole('tab', { name: 'Methods' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByTestId('payment-method-manager')).toHaveTextContent(
      'Methods active'
    );

    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByTestId('payment-history')).toHaveTextContent(
      'History active'
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Invoices' }));
    expect(screen.getByTestId('payment-invoices')).toHaveTextContent(
      'Invoices active'
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Refunds' }));
    expect(screen.getByTestId('payment-refunds')).toHaveTextContent(
      'Refunds active'
    );
  });

  test('closes tools when toggled again', () => {
    render(<PaymentManagementPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Tools' }));
    expect(
      screen.getByRole('button', { name: 'Hide Tools' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide Tools' }));

    expect(
      screen.queryByRole('tablist', { name: 'Billing tools' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('payment-method-manager')
    ).not.toBeInTheDocument();
  });
});
