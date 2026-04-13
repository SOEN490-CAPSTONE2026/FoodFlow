import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterType from '../components/RegisterType';

// ─── Mock dependencies ────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
}));

jest.mock('../components/SEOHead', () => () => null);

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Render ───────────────────────────────────────────────────────────────────

describe('RegisterType render', () => {
  test('renders without throwing', () => {
    expect(() => render(<RegisterType />)).not.toThrow();
  });

  test('renders FoodFlow logo image', () => {
    render(<RegisterType />);
    expect(screen.getByAltText('FoodFlow Logo')).toBeInTheDocument();
  });

  test('renders donor registration button', () => {
    render(<RegisterType />);
    expect(
      screen.getByRole('button', { name: /registerType\.donor\.button/i })
    ).toBeInTheDocument();
  });

  test('renders receiver registration button', () => {
    render(<RegisterType />);
    expect(
      screen.getByRole('button', { name: /registerType\.receiver\.button/i })
    ).toBeInTheDocument();
  });

  test('renders Donor Icon image', () => {
    render(<RegisterType />);
    expect(screen.getByAltText('Donor Icon')).toBeInTheDocument();
  });

  test('renders Receiver Icon image', () => {
    render(<RegisterType />);
    expect(screen.getByAltText('Receiver Icon')).toBeInTheDocument();
  });

  test('renders illustration image', () => {
    render(<RegisterType />);
    expect(screen.getByAltText('Woman carrying food box')).toBeInTheDocument();
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

describe('RegisterType navigation', () => {
  test('clicking the donor button navigates to /register/donor', async () => {
    render(<RegisterType />);
    await userEvent.click(
      screen.getByRole('button', { name: /registerType\.donor\.button/i })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/register/donor');
  });

  test('clicking the receiver button navigates to /register/receiver', async () => {
    render(<RegisterType />);
    await userEvent.click(
      screen.getByRole('button', { name: /registerType\.receiver\.button/i })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/register/receiver');
  });

  test('clicking the logo navigates to /', async () => {
    render(<RegisterType />);
    await userEvent.click(screen.getByAltText('FoodFlow Logo'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('navigate is not called on initial render', () => {
    render(<RegisterType />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('donor and receiver buttons call navigate exactly once each', async () => {
    render(<RegisterType />);
    await userEvent.click(
      screen.getByRole('button', { name: /registerType\.donor\.button/i })
    );
    expect(mockNavigate).toHaveBeenCalledTimes(1);

    await userEvent.click(
      screen.getByRole('button', { name: /registerType\.receiver\.button/i })
    );
    expect(mockNavigate).toHaveBeenCalledTimes(2);
  });
});

// ─── i18n keys rendered ───────────────────────────────────────────────────────

describe('RegisterType i18n', () => {
  test('renders the page title translation key', () => {
    render(<RegisterType />);
    expect(screen.getByText('registerType.title')).toBeInTheDocument();
  });

  test('renders the page subtitle translation key', () => {
    render(<RegisterType />);
    expect(screen.getByText('registerType.subtitle')).toBeInTheDocument();
  });

  test('renders donor heading translation key', () => {
    render(<RegisterType />);
    expect(screen.getByText('registerType.donor.heading')).toBeInTheDocument();
  });

  test('renders receiver heading translation key', () => {
    render(<RegisterType />);
    expect(
      screen.getByText('registerType.receiver.heading')
    ).toBeInTheDocument();
  });
});
