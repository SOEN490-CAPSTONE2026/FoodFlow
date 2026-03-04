import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminWelcome from '../AdminWelcome';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

describe('AdminWelcome', () => {
  test('renders key-based heading and description', () => {
    render(<AdminWelcome />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'adminWelcome.title' })
    ).toBeInTheDocument();
    expect(screen.getByText('adminWelcome.description')).toBeInTheDocument();
  });
});
