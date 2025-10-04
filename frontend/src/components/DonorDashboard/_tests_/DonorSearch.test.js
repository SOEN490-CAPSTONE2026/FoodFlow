import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import DonorSearch from '../DonorSearch';

function makeItems(n = 2) {
  return Array.from({ length: n }, (_, i) => ({
    id: `${i + 1}`,
    title: `Item ${i + 1}`,
    category: i % 2 ? 'Veg' : 'Fruit',
    qty: 3 + i,
    unit: 'kg',
    expiresAt: '2025-10-01T10:30:00Z',
    status: i % 2 ? 'pending' : 'active',
  }));
}

test('runs onSearch when clicking Search and when pressing Enter', async () => {
  const user = userEvent.setup();
  const onSearch = jest.fn();
  render(<DonorSearch items={[]} total={0} loading={false} onSearch={onSearch} />);

  const input = screen.getByPlaceholderText(/search by title/i);
  await user.type(input, 'apples');
  await user.click(screen.getByRole('button', { name: /search/i }));
  expect(onSearch).toHaveBeenCalledWith('apples');

  // Enter key path
  onSearch.mockClear();
  await user.clear(input);
  await user.type(input, 'bananas{enter}');
  expect(onSearch).toHaveBeenCalledWith('bananas');
});

test('renders table rows and counter', () => {
  const items = makeItems(2);
  render(<DonorSearch items={items} total={10} loading={false} onSearch={() => {}} />);

  expect(screen.getByText('Item 1')).toBeInTheDocument();
  expect(screen.getByText('Item 2')).toBeInTheDocument();
  expect(screen.getByText('2 / 10')).toBeInTheDocument();
});

test('shows loading and disables button', () => {
  render(<DonorSearch items={[]} total={0} loading={true} onSearch={() => {}} />);

  
  expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled();

  // There are TWO "Loading…" nodes (helper + table row) 
  const loads = screen.getAllByText(/loading/i);
  expect(loads.length).toBeGreaterThan(0);
});
