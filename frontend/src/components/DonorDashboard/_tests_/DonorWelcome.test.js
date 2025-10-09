import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DonorWelcome from '../DonorWelcome';


beforeAll(() => {
  class IO {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  if (!global.IntersectionObserver) {
    global.IntersectionObserver = IO;
  }
});

test('map button links to /donor/search#org-search', () => {
  render(
    <MemoryRouter>
      <DonorWelcome />
    </MemoryRouter>
  );

  const link = screen.getByRole('link', { name: /map of organizations/i });
  
  expect(link).toBeInTheDocument();
  expect(link.getAttribute('href')).toBe('/donor/search#org-search');
  
});
