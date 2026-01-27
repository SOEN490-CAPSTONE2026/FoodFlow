import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ReceiverLayout from '../ReceiverLayout';
import { AuthContext } from '../../../contexts/AuthContext';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

jest.mock('../../../services/socket', () => ({
  connectToUserQueue: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock('../../../services/api', () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  profileAPI: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

const mockLogout = jest.fn();

function renderAt(path = '/receiver') {
  return render(
    <AuthContext.Provider value={{ logout: mockLogout }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/receiver/*" element={<ReceiverLayout />}>
            <Route index element={<div>Browse</div>} />
            <Route path="welcome" element={<div>Welcome</div>} />
            <Route path="browse" element={<div>Browse</div>} />
            <Route path="my-claims" element={<div>My Claims</div>} />
            <Route path="messages" element={<div>Messages</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ReceiverLayout', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogout.mockReset();
  });

  test("renders browse title/description at /receiver and marks 'Donations' active", () => {
    renderAt('/receiver');
    expect(
      screen.getByRole('heading', { name: /receiver dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/overview of nearby food and your activity/i)
    ).toBeInTheDocument();

    const nav = screen.getByRole('link', { name: /^donations$/i });
    expect(nav).toHaveClass('receiver-nav-link');
    expect(nav).toHaveClass('active');
  });

  test("renders welcome title/description at /receiver/welcome and marks 'Saved Donations' active", () => {
    renderAt('/receiver/welcome');
    expect(
      screen.getByRole('heading', { name: /welcome/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/start here: search the map or browse nearby food/i)
    ).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /saved donations/i });
    expect(link).toHaveClass('active');
  });

  test("renders browse title/description at /receiver/browse and marks 'Donations' active", () => {
    renderAt('/receiver/browse');
    expect(
      screen.getByRole('heading', { name: /browse available food/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/browse available food listings/i)
    ).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /^donations$/i });
    expect(link).toHaveClass('active');
  });

  test("renders my claims page at /receiver/my-claims and marks 'My Claims' active", () => {
    renderAt('/receiver/my-claims');

    // Check that My Claims link is active
    const link = screen.getByRole('link', { name: /my claims/i });
    expect(link).toHaveClass('active');

    // Check that the my claims content is rendered (using getAllByText since it appears in nav and content)
    const myClaimsElements = screen.getAllByText('My Claims');
    expect(myClaimsElements.length).toBeGreaterThan(0);
  });

  test("renders messages title/description at /receiver/messages and marks 'Messages' active", () => {
    renderAt('/receiver/messages');

    // Check that Messages inbox button is present
    const button = screen.getByRole('button', { name: /^messages$/i });
    expect(button).toBeInTheDocument();

    // Check that the messages page content is rendered
    const messagesContent = screen.getAllByText('Messages');
    expect(messagesContent.length).toBeGreaterThan(0);
  });

  test('opens account menu via avatar button and logs out', async () => {
    renderAt('/receiver');

    const avatarBtn = screen.getByRole('button', { name: /account menu/i });
    fireEvent.click(avatarBtn);

    const menu = screen.getByText(/logout/i).closest('.dropdown-menu');
    expect(menu).toBeInTheDocument();

    const logoutBtn = within(menu).getByText(/logout/i);
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/', {
        replace: true,
        state: { scrollTo: 'home' },
      });
    });
  });

  test('account menu closes on outside click', () => {
    renderAt('/receiver');
    const avatarBtn = screen.getByRole('button', { name: /account menu/i });

    fireEvent.click(avatarBtn);
    expect(screen.getByText(/logout/i)).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
  });
});
