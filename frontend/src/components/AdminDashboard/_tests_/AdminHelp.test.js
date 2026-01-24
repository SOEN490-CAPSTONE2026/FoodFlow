import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminHelp from '../AdminHelp';

describe('AdminHelp', () => {
  it('renders Help heading', () => {
    render(<AdminHelp />);
    expect(screen.getByRole('heading', { name: /help/i })).toBeInTheDocument();
  });
});
