import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from './LandingPage';

// Mock child components
jest.mock('./Footer', () => () => <div data-testid="footer">Footer</div>);
jest.mock('./Home', () => () => <div data-testid="home">Home</div>);
jest.mock('./AboutUs', () => () => <div data-testid="about-us">AboutUs</div>);
jest.mock('./FAQ', () => () => <div data-testid="faq">FAQ</div>);
jest.mock('./HowItWorks', () => () => <div data-testid="how-it-works">HowItWorks</div>);

// Mock useLocation
const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockUseLocation(),
}));

describe('LandingPage', () => {
  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    mockUseLocation.mockReturnValue({ state: null });
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders all sections correctly', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByTestId('home')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('about-us')).toBeInTheDocument();
    expect(screen.getByTestId('faq')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  test('renders sections with correct IDs', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByTestId('home').closest('section')).toHaveAttribute('id', 'home');
    expect(screen.getByTestId('how-it-works').closest('section')).toHaveAttribute('id', 'how-it-works');
    expect(screen.getByTestId('about-us').closest('section')).toHaveAttribute('id', 'about');
    expect(screen.getByTestId('faq').closest('section')).toHaveAttribute('id', 'faqs');
    expect(screen.getByTestId('footer').closest('section')).toHaveAttribute('id', 'contact');
  });
});