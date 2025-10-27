import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import DonorLayout from '../DonorLayout';

const mockAuthContext = {
  isLoggedIn: true,
  role: 'DONOR',
  login: jest.fn(),
  logout: jest.fn(),
};

jest.mock("../../../services/socket", () => ({
  connectToUserQueue: jest.fn(),
  disconnect: jest.fn(),
}));

function renderAt(pathname = '/donor/search') {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter initialEntries={[pathname]}>
        <Routes>
          <Route path="/donor" element={<DonorLayout />}>
            <Route index element={<div>Home</div>} />
            <Route path="dashboard" element={<div>Dash</div>} />
            <Route path="list" element={<div>List</div>} />
            <Route path="requests" element={<div>Req</div>} />
            <Route path="search" element={<div>Search</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

test('highlights PickUp Schedule link when on /donor/search', () => {
  renderAt('/donor/search');
  const searchLink = screen.getByRole('link', { name: /pickup schedule/i });
  expect(searchLink).toHaveClass('active');
});

test('shows page title and description for /donor', () => {
  renderAt('/donor');
  expect(screen.getByRole('heading', { name: /donor dashboard/i })).toBeInTheDocument();
  expect(screen.getByText(/overview and quick actions/i)).toBeInTheDocument();
});