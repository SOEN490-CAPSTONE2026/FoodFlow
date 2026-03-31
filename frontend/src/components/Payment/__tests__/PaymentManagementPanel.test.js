import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentManagementPanel from '../PaymentManagementPanel';

// Mock all child components
jest.mock('../PaymentMethodManager', () => () => (
  <div data-testid="payment-method-manager" />
));
jest.mock('../PaymentHistory', () => () => (
  <div data-testid="payment-history" />
));
jest.mock('../PaymentInvoices', () => () => (
  <div data-testid="payment-invoices" />
));
jest.mock('../PaymentRefunds', () => () => (
  <div data-testid="payment-refunds" />
));

describe('PaymentManagementPanel', () => {
  test('renders Billing Tools heading', () => {
    render(<PaymentManagementPanel />);
    expect(screen.getByText('Billing Tools')).toBeInTheDocument();
  });

  test('renders Open Tools button initially', () => {
    render(<PaymentManagementPanel />);
    expect(screen.getByText('Open Tools')).toBeInTheDocument();
  });

  test('does not show tabs or content initially', () => {
    render(<PaymentManagementPanel />);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('payment-method-manager')
    ).not.toBeInTheDocument();
  });

  test('clicking Open Tools shows tabs and changes button to Hide Tools', () => {
    render(<PaymentManagementPanel />);
    fireEvent.click(screen.getByText('Open Tools'));
    expect(screen.getByText('Hide Tools')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  test('clicking Open Tools shows Methods tab content by default', () => {
    render(<PaymentManagementPanel />);
    fireEvent.click(screen.getByText('Open Tools'));
    expect(screen.getByTestId('payment-method-manager')).toBeInTheDocument();
  });

  test('clicking Hide Tools hides content again', () => {
    render(<PaymentManagementPanel />);
    fireEvent.click(screen.getByText('Open Tools'));
    fireEvent.click(screen.getByText('Hide Tools'));
    expect(screen.getByText('Open Tools')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  test('clicking History tab shows PaymentHistory', () => {
    render(<PaymentManagementPanel />);
    fireEvent.click(screen.getByText('Open Tools'));
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByTestId('payment-history')).toBeInTheDocument();
    expect(
      screen.queryByTestId('payment-method-manager')
    ).not.toBeInTheDocument();
  });

  test('clicking Invoices tab shows PaymentInvoices', () => {
    render(<PaymentManagementPanel />);
    fireEvent.click(screen.getByText('Open Tools'));
    fireEvent.click(screen.getByText('Invoices'));
    expect(screen.getByTestId('payment-invoices')).toBeInTheDocument();
  });

  test('clicking Refunds tab shows PaymentRefunds', () => {
    render(<PaymentManagementPanel />);
    fireEvent.click(screen.getByText('Open Tools'));
    fireEvent.click(screen.getByText('Refunds'));
    expect(screen.getByTestId('payment-refunds')).toBeInTheDocument();
  });

  test('active tab has aria-selected true', () => {
    render(<PaymentManagementPanel />);
    fireEvent.click(screen.getByText('Open Tools'));
    const methodsTab = screen.getByRole('tab', { name: 'Methods' });
    expect(methodsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('inactive tabs have aria-selected false', () => {
    render(<PaymentManagementPanel />);
    fireEvent.click(screen.getByText('Open Tools'));
    const historyTab = screen.getByRole('tab', { name: 'History' });
    expect(historyTab).toHaveAttribute('aria-selected', 'false');
  });

  test('switching tabs updates aria-selected correctly', () => {
    render(<PaymentManagementPanel />);
    fireEvent.click(screen.getByText('Open Tools'));
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Methods' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  test('renders all four tabs when open', () => {
    render(<PaymentManagementPanel />);
    fireEvent.click(screen.getByText('Open Tools'));
    expect(screen.getByRole('tab', { name: 'Methods' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Invoices' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Refunds' })).toBeInTheDocument();
  });
});
