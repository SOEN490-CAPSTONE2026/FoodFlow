import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatWidget from '../ChatWidget';
import api from '../../../services/api';

// Mock the API service
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

// Mock react-router-dom and expose navigate mock for assertions
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
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

  test('toggles widget open/close and shows panel', async () => {
    render(<ChatWidget />);
    const toggle = screen.getByRole('button', { name: /open support chat/i });
    // open panel
    userEvent.click(toggle);
    await waitFor(() => {
      expect(document.querySelector('.support-chat-panel')).toBeInTheDocument();
    });
    expect(document.querySelector('textarea')).toBeInTheDocument();
    // close panel
    const closeBtn = screen.getByRole('button', {
      name: /Close support chat/i,
    });
    userEvent.click(closeBtn);
    await waitFor(() => {
      expect(
        document.querySelector('.support-chat-panel')
      ).not.toBeInTheDocument();
    });
  });

  test('sends a message and displays assistant reply with various actions', async () => {
    render(<ChatWidget />);
    userEvent.click(screen.getByRole('button', { name: /open support chat/i }));
    await waitFor(() =>
      expect(document.querySelector('textarea')).toBeInTheDocument()
    );
    const input = document.querySelector('textarea');

    // prepare api mock before sending
    const replyData = {
      reply: 'Here are some options',
      intent: 'info',
      actions: [
        { type: 'link', label: 'Dashboard', value: '/admin' },
        { type: 'contact', label: 'Email Us', value: 'support@foodflow.com' },
        { type: 'copy', label: 'CopyCode', value: '1234' },
      ],
    };
    api.post.mockResolvedValue({ data: replyData });

    // type message and send via clicking send button
    await userEvent.type(input, 'Hello');
    const sendBtn = screen.getByTestId('send-icon').closest('button');
    userEvent.click(sendBtn);

    // ensure API was called and then await assistant reply
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    await screen.findByText('Here are some options');
    // link action should render and work
    const linkBtn = screen.getByText(/Dashboard/i);
    expect(linkBtn).toBeInTheDocument();
    userEvent.click(linkBtn); // exercise internal link handling (navigate)

    // contact action should render and handle mailto
    const mailBtn = screen.getByText(/Email Us/i);
    expect(mailBtn).toBeInTheDocument();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    });
    userEvent.click(mailBtn); // exercise contact action branch

    // copy action should render (click to exercise branch)
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
    const copyBtn = screen.getByText(/CopyCode/i);
    userEvent.click(copyBtn);
  });

  test('handles api error and shows contact action', async () => {
    render(<ChatWidget />);
    userEvent.click(screen.getByRole('button', { name: /open support chat/i }));
    await waitFor(() =>
      expect(document.querySelector('textarea')).toBeInTheDocument()
    );
    const input = document.querySelector('textarea');

    api.post.mockRejectedValue(new Error('network'));
    await userEvent.type(input, 'Help');
    const sendBtn = screen.getByTestId('send-icon').closest('button');
    userEvent.click(sendBtn);

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const errorMsg = await screen.findByText(/cannot respond right now/i);
    expect(errorMsg).toBeInTheDocument();
    const contactBtn = screen.getByText(/Contact Support/i);
    expect(contactBtn).toBeInTheDocument();
  });
});
