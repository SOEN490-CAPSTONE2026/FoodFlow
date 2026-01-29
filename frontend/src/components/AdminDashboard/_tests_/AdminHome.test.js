import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminHome from '../AdminHome';

describe('AdminHome', () => {
  it('renders Welcome heading and overview text', () => {
    render(<AdminHome />);
    expect(
      screen.getByRole('heading', { name: /welcome/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/admin dashboard overview/i)).toBeInTheDocument();
  });
});
