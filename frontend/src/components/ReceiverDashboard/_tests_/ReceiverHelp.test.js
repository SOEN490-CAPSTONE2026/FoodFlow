import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReceiverHelp from '../ReceiverHelp';

const mockStartReceiverTutorial = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../../../contexts/OnboardingContext', () => ({
  useOnboarding: () => ({
    canReplayReceiverTutorial: true,
    isReceiverTutorialActive: false,
    startReceiverTutorial: mockStartReceiverTutorial,
  }),
}));

const renderWithRouter = component =>
  render(<BrowserRouter>{component}</BrowserRouter>);

describe('ReceiverHelp', () => {
  test('renders key-based sections', () => {
    renderWithRouter(<ReceiverHelp />);
    expect(
      screen.getByText('receiverHelp.gettingStarted.title')
    ).toBeInTheDocument();
    expect(screen.getByText('receiverHelp.faq.title')).toBeInTheDocument();
    expect(screen.getByText('receiverHelp.support.title')).toBeInTheDocument();
  });

  test('expands FAQ item by key', () => {
    renderWithRouter(<ReceiverHelp />);
    const question = screen.getByText('receiverHelp.faq.items.q1.question');
    fireEvent.click(question);
    expect(
      screen.getByText('receiverHelp.faq.items.q1.answer')
    ).toBeInTheDocument();
  });

  test('starts tutorial from help page', () => {
    renderWithRouter(<ReceiverHelp />);
    fireEvent.click(screen.getByText('onboarding.help.replayButton'));
    expect(mockStartReceiverTutorial).toHaveBeenCalled();
  });
});
