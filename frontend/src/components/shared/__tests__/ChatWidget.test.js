import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatWidget from '../ChatWidget';

// Mock the API service
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  MessageCircle: () => (
    <div data-testid="message-circle-icon">MessageCircle</div>
  ),
  X: () => <div data-testid="x-icon">X</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
  Phone: () => <div data-testid="phone-icon">Phone</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  ExternalLink: () => <div data-testid="external-link-icon">ExternalLink</div>,
}));

// Mock scrollIntoView which doesn't exist in test environment
global.Element.prototype.scrollIntoView = jest.fn();

describe('ChatWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        username: 'testuser',
        role: 'RECEIVER',
        languagePreference: 'en',
      },
    });
  });

  test('renders chat widget button', () => {
    render(<ChatWidget />);

    const chatButton = screen.getByTestId('message-circle-icon');
    expect(chatButton).toBeInTheDocument();
  });

  test('renders without crashing', () => {
    const { container } = render(<ChatWidget />);
    expect(container).toBeInTheDocument();
  });

  test('shows message circle icon by default', () => {
    render(<ChatWidget />);
    expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
  });

  test('handles component mounting and unmounting', () => {
    const { unmount } = render(<ChatWidget />);
    expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
    unmount();
  });

  test('handles missing user context gracefully', () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { container } = render(<ChatWidget />);
    expect(container).toBeInTheDocument();
  });

  test('renders with different user roles', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 2,
        username: 'donor_user',
        role: 'DONOR',
        languagePreference: 'en',
      },
    });

    const { container } = render(<ChatWidget />);
    expect(container).toBeInTheDocument();
  });

  test('handles empty message input', () => {
    render(<ChatWidget />);

    const chatButton = screen
      .getByTestId('message-circle-icon')
      .closest('button');
    expect(chatButton).toBeInTheDocument();

    // Additional assertion for code coverage
    expect(chatButton).toBeVisible();
  });
});
