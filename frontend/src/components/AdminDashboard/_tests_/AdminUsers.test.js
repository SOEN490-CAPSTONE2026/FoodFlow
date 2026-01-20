import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import AdminUsers from '../AdminUsers';

// Mock axios before importing the component
jest.mock('axios');

describe('AdminUsers', () => {
  beforeEach(() => {
    localStorage.setItem('jwtToken', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<AdminUsers />);
    expect(container).toBeInTheDocument();
  });
});
