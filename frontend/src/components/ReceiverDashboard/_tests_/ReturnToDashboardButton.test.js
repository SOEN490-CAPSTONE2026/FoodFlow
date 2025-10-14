import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReturnToDashboardButton from '../ReturnToDashboardButton';

const mockNavigate = jest.fn();
const mockLocation = {
  pathname: '/',
  state: null,
  search: '',
  hash: ''
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation
}));

describe('ReturnToDashboardButton', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
    mockLocation.state = null;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should not render when no "from" value exists', () => {
    const { container } = render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render button for receiver when from state is "receiver"', () => {
    mockLocation.state = { from: 'receiver' };
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /return to your dashboard/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText(/Back to Receiver Dashboard/i)).toBeInTheDocument();
  });

  it('should render button for donor when from state is "donor"', () => {
    mockLocation.state = { from: 'donor' };
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /return to your dashboard/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText(/Back to Donor Dashboard/i)).toBeInTheDocument();
  });

  it('should render button for admin when from state is "admin"', () => {
    mockLocation.state = { from: 'admin' };
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /return to your dashboard/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText(/Back to Donor Dashboard/i)).toBeInTheDocument();
  });

  it('should read from sessionStorage when location.state is null', () => {
    sessionStorage.setItem('returnFrom', 'donor');
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    expect(screen.getByText(/Back to Donor Dashboard/i)).toBeInTheDocument();
  });

  it('should save "from" to sessionStorage when location.state.from exists', () => {
    mockLocation.state = { from: 'receiver' };
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    expect(sessionStorage.getItem('returnFrom')).toBe('receiver');
  });

  it('should navigate to receiver dashboard when clicked', () => {
    mockLocation.state = { from: 'receiver' };
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /return to your dashboard/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/receiver/dashboard');
  });

  it('should navigate to donor dashboard when clicked', () => {
    mockLocation.state = { from: 'donor' };
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /return to your dashboard/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/donor/dashboard');
  });

  it('should navigate to admin dashboard when clicked', () => {
    mockLocation.state = { from: 'admin' };
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /return to your dashboard/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('should remove returnFrom from sessionStorage when clicked', () => {
    sessionStorage.setItem('returnFrom', 'donor');
    mockLocation.state = { from: 'donor' };
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /return to your dashboard/i });
    fireEvent.click(button);

    expect(sessionStorage.getItem('returnFrom')).toBeNull();
  });

  it('should call onNavigate callback when provided', () => {
    const mockOnNavigate = jest.fn();
    mockLocation.state = { from: 'donor' };
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton onNavigate={mockOnNavigate} />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /return to your dashboard/i });
    fireEvent.click(button);

    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  it('should not call onNavigate when not provided', () => {
    mockLocation.state = { from: 'donor' };
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /return to your dashboard/i });
    
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('should update when location.state.from changes', () => {
    mockLocation.state = { from: 'donor' };
    
    const { rerender } = render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    expect(screen.getByText(/Back to Donor Dashboard/i)).toBeInTheDocument();

    mockLocation.state = { from: 'receiver' };
    
    rerender(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    expect(screen.getByText(/Back to Receiver Dashboard/i)).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    mockLocation.state = { from: 'donor' };
    
    render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('return-chip');
    
    const avatar = button.querySelector('.return-chip-avatar');
    expect(avatar).toBeInTheDocument();
    
    const text = button.querySelector('.return-chip-text');
    expect(text).toBeInTheDocument();
  });

  it('should not render for invalid "from" values', () => {
    mockLocation.state = { from: 'invalid' };
    
    const { container } = render(
      <BrowserRouter>
        <ReturnToDashboardButton />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });
});