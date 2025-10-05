import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DonorLayout from '../DonorLayout';

function renderAt(pathname = '/donor/search') {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route element={<DonorLayout />}>
          <Route path="/donor" element={<div>Home</div>} />
          <Route path="/donor/dashboard" element={<div>Dash</div>} />
          <Route path="/donor/list" element={<div>List</div>} />
          <Route path="/donor/requests" element={<div>Req</div>} />
          <Route path="/donor/search" element={<div>Search</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

test('highlights Search link when on /donor/search', () => {
  renderAt('/donor/search');
  const searchLink = screen.getByRole('link', { name: /^search$/i });
  expect(searchLink).toHaveClass('active');
});

test('shows page title and description for /donor', () => {
  renderAt('/donor');
  expect(screen.getByRole('heading', { name: /donate food now/i })).toBeInTheDocument();
  expect(screen.getByText(/every gift makes a difference/i)).toBeInTheDocument();
});
