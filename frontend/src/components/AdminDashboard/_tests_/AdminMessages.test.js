import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminMessages from '../AdminMessages';

describe('AdminMessages', () => {
  it('renders Messages heading and placeholder', () => {
    render(<AdminMessages />);
    expect(
      screen.getByRole('heading', { name: /messages/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/add inbox\/message list here/i)
    ).toBeInTheDocument();
  });
});
