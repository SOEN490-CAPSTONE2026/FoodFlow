import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import { authAPI } from '../services/api';

// Mock the react-router-dom navigate function
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

// Mock the authAPI
jest.mock('../services/api', () => ({
  authAPI: {
    logout: jest.fn(),
  },
}));

describe('NavigationBar', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    useNavigate.mockImplementation(() => mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders logout button', () => {
    render(<NavigationBar />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('handles logout correctly', () => {
    render(<NavigationBar />);
    const logoutButton = screen.getByText('Logout');

    fireEvent.click(logoutButton);

    expect(authAPI.logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/'); // Updated to match the correct route
  });
});
