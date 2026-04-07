import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentWorkspaceBar from '../components/Payment/PaymentWorkspaceBar';

describe('PaymentWorkspaceBar', () => {
  const views = [
    { id: 'donate', label: 'Donate' },
    { id: 'methods', label: 'Methods' },
    { id: 'history', label: 'History' },
  ];

  it('renders the active section description', () => {
    render(
      <PaymentWorkspaceBar
        views={views}
        activeView="methods"
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Payment Workspace')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Manage your saved cards and bank accounts for faster future payments/i
      )
    ).toBeInTheDocument();
  });

  it('falls back to the default description for unknown sections', () => {
    render(
      <PaymentWorkspaceBar
        views={views}
        activeView="unknown"
        onChange={jest.fn()}
      />
    );

    expect(
      screen.getByText(/Move through billing sections like separate pages/i)
    ).toBeInTheDocument();
  });

  it('calls onChange when a tab is clicked', () => {
    const onChange = jest.fn();
    render(
      <PaymentWorkspaceBar
        views={views}
        activeView="donate"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    expect(onChange).toHaveBeenCalledWith('history');
  });
});
