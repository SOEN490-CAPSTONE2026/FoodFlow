import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DonorHelp from '../components/DonorDashboard/DonorHelp';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

const mockStartDonorTutorial = jest.fn();

jest.mock('../contexts/OnboardingContext', () => ({
  useOnboarding: () => ({
    canReplayDonorTutorial: true,
    isDonorTutorialActive: false,
    startDonorTutorial: mockStartDonorTutorial,
  }),
}));

const renderWithRouter = component =>
  render(<BrowserRouter>{component}</BrowserRouter>);

describe('DonorHelp', () => {
  test('renders key-based sections', () => {
    renderWithRouter(<DonorHelp />);
    expect(
      screen.getByRole('heading', {
        name: 'donorHelp.gettingStarted.title',
        level: 2,
      })
    ).toBeInTheDocument();
    expect(screen.getByText('donorHelp.faq.title')).toBeInTheDocument();
    expect(screen.getByText('donorHelp.support.title')).toBeInTheDocument();
  });

  test('expands FAQ item by key', () => {
    renderWithRouter(<DonorHelp />);
    const question = screen.getByText('donorHelp.faq.items.q1.question');
    fireEvent.click(question);
    expect(
      screen.getByText('donorHelp.faq.items.q1.answer')
    ).toBeInTheDocument();
  });

  test('starts tutorial from help page', () => {
    renderWithRouter(<DonorHelp />);
    fireEvent.click(screen.getByText('onboarding.help.replayButton'));
    expect(mockStartDonorTutorial).toHaveBeenCalled();
  });
});
