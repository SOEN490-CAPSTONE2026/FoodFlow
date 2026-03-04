import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DonorHelp from '../DonorHelp';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

const renderWithRouter = component => render(<BrowserRouter>{component}</BrowserRouter>);

describe('DonorHelp', () => {
  test('renders key-based sections', () => {
    renderWithRouter(<DonorHelp />);
    expect(screen.getByText('donorHelp.gettingStarted.title')).toBeInTheDocument();
    expect(screen.getByText('donorHelp.faq.title')).toBeInTheDocument();
    expect(screen.getByText('donorHelp.support.title')).toBeInTheDocument();
  });

  test('expands FAQ item by key', () => {
    renderWithRouter(<DonorHelp />);
    const question = screen.getByText('donorHelp.faq.items.q1.question');
    fireEvent.click(question);
    expect(screen.getByText('donorHelp.faq.items.q1.answer')).toBeInTheDocument();
  });
});
