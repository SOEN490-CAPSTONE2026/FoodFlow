import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminCalendar from '../AdminCalendar';

describe('AdminCalendar', () => {
  it('renders Calendar heading', () => {
    render(<AdminCalendar />);
    expect(
      screen.getByRole('heading', { name: /calendar/i })
    ).toBeInTheDocument();
  });
});
