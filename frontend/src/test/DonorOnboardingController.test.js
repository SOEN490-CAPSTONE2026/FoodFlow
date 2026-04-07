import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import DonorOnboardingController from '../components/onboarding/DonorOnboardingController';
import { useOnboarding } from '../contexts/OnboardingContext';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      if (key === 'onboarding.stepProgress') {
        return `step ${params.current} of ${params.total}`;
      }
      return key;
    },
  }),
}));

const mockNavigate = jest.fn();
let mockPathname = '/';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

const mockProfileGet = jest.fn();
const mockUpdateOnboarding = jest.fn();

jest.mock('../services/api', () => ({
  profileAPI: {
    get: (...args) => mockProfileGet(...args),
    updateOnboarding: (...args) => mockUpdateOnboarding(...args),
  },
}));

function TutorialHarness() {
  const {
    startDonorTutorial,
    startReceiverTutorial,
    isTutorialActive,
    currentTutorialRole,
    currentTutorialStepKey,
    canReplayDonorTutorial,
    canReplayReceiverTutorial,
    onboardingCompleted,
  } = useOnboarding();

  return (
    <div>
      <button type="button" onClick={startDonorTutorial}>
        replay donor
      </button>
      <button type="button" onClick={startReceiverTutorial}>
        replay receiver
      </button>
      <div data-testid="active-flag">{String(isTutorialActive)}</div>
      <div data-testid="role-flag">{String(currentTutorialRole)}</div>
      <div data-testid="step-flag">{String(currentTutorialStepKey)}</div>
      <div data-testid="donor-replay-flag">
        {String(canReplayDonorTutorial)}
      </div>
      <div data-testid="receiver-replay-flag">
        {String(canReplayReceiverTutorial)}
      </div>
      <div data-testid="completed-flag">{String(onboardingCompleted)}</div>
      <main data-tour="donor-dashboard-main">Donor dashboard</main>
      <button type="button" data-tour="donor-nav-impact">
        Donor impact
      </button>
      <button type="button" data-tour="donor-nav-donate">
        Donor donate
      </button>
      <button type="button" data-tour="donor-nav-messages">
        Donor messages
      </button>
      <button type="button" data-tour="donor-nav-settings">
        Donor settings
      </button>
      <button type="button" data-tour="receiver-nav-browse">
        Receiver browse
      </button>
      <button type="button" data-tour="receiver-nav-saved">
        Receiver saved
      </button>
      <button type="button" data-tour="receiver-nav-claims">
        Receiver claims
      </button>
      <button type="button" data-tour="receiver-nav-messages">
        Receiver messages
      </button>
      <button type="button" data-tour="receiver-nav-impact">
        Receiver impact
      </button>
      <button type="button" data-tour="receiver-preferences-entry">
        Receiver preferences
      </button>
      <button type="button" data-tour="receiver-settings-entry">
        Receiver settings
      </button>
    </div>
  );
}

const renderController = role =>
  render(
    <DonorOnboardingController role={role}>
      <TutorialHarness />
    </DonorOnboardingController>
  );

describe('DonorOnboardingController', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 900,
    });
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb();
      return 1;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterAll(() => {
    window.requestAnimationFrame.mockRestore();
    window.cancelAnimationFrame.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
    mockNavigate.mockImplementation(path => {
      mockPathname = path;
    });
    mockProfileGet.mockResolvedValue({
      data: { onboardingCompleted: true },
    });
    mockUpdateOnboarding.mockResolvedValue({
      data: { onboardingCompleted: true },
    });
  });

  test('does not show a tutorial for unsupported roles', async () => {
    renderController('ADMIN');

    await waitFor(() => {
      expect(screen.getByTestId('completed-flag')).toHaveTextContent('true');
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('donor-replay-flag')).toHaveTextContent('false');
    expect(screen.getByTestId('receiver-replay-flag')).toHaveTextContent(
      'false'
    );
  });

  test('auto-starts the donor tutorial when onboarding is incomplete', async () => {
    mockProfileGet.mockResolvedValueOnce({
      data: { onboardingCompleted: false },
    });

    renderController('DONOR');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText('onboarding.donor.steps.dashboard.title')
    ).toBeInTheDocument();
    expect(screen.getByTestId('active-flag')).toHaveTextContent('true');
    expect(screen.getByTestId('role-flag')).toHaveTextContent('DONOR');
    expect(screen.getByTestId('step-flag')).toHaveTextContent('dashboard');
    expect(mockNavigate).toHaveBeenCalledWith('/donor');
  });

  test('moves forward and backward through donor tutorial steps', async () => {
    mockProfileGet.mockResolvedValueOnce({
      data: { onboardingCompleted: false },
    });

    renderController('DONOR');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'onboarding.actions.next' })
    );

    await waitFor(() => {
      expect(
        screen.getByText('onboarding.donor.steps.impact.title')
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('step-flag')).toHaveTextContent(
      'impact-dashboard'
    );
    expect(mockNavigate).toHaveBeenCalledWith('/donor/impact');
    expect(screen.getByText('step 2 of 6')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'onboarding.actions.back' })
    );

    await waitFor(() => {
      expect(
        screen.getByText('onboarding.donor.steps.dashboard.title')
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('step-flag')).toHaveTextContent('dashboard');
  });

  test('persists onboarding completion when donor skips the first-run tutorial', async () => {
    mockProfileGet.mockResolvedValueOnce({
      data: { onboardingCompleted: false },
    });

    renderController('DONOR');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'onboarding.actions.skip' })
    );

    await waitFor(() => {
      expect(mockUpdateOnboarding).toHaveBeenCalledWith({
        onboardingCompleted: true,
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('completed-flag')).toHaveTextContent('true');
    expect(screen.getByTestId('active-flag')).toHaveTextContent('false');
  });

  test('shows an error and keeps the tutorial open when completion persistence fails', async () => {
    mockProfileGet.mockResolvedValueOnce({
      data: { onboardingCompleted: false },
    });
    mockUpdateOnboarding.mockRejectedValueOnce(new Error('save failed'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    renderController('DONOR');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'onboarding.actions.skip' })
    );

    expect(
      await screen.findByText('onboarding.errors.saveFailed')
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('active-flag')).toHaveTextContent('true');

    console.error.mockRestore();
  });

  test('allows replaying the donor tutorial without persisting completion again', async () => {
    renderController('DONOR');

    await waitFor(() => {
      expect(screen.getByTestId('donor-replay-flag')).toHaveTextContent('true');
    });

    fireEvent.click(screen.getByText('replay donor'));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(
        screen.getByRole('button', { name: 'onboarding.actions.next' })
      );
    }

    expect(
      await screen.findByText('onboarding.donor.steps.setup.title')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'onboarding.actions.finish' })
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(mockUpdateOnboarding).not.toHaveBeenCalled();
  });

  test('auto-starts the receiver tutorial and supports replay skip without persistence', async () => {
    mockProfileGet.mockResolvedValueOnce({
      data: { onboardingCompleted: false },
    });

    renderController('RECEIVER');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText('onboarding.receiver.steps.browse.title')
    ).toBeInTheDocument();
    expect(screen.getByTestId('role-flag')).toHaveTextContent('RECEIVER');
    expect(screen.getByTestId('step-flag')).toHaveTextContent(
      'browse-donations'
    );
    expect(mockNavigate).toHaveBeenCalledWith('/receiver');

    fireEvent.click(
      screen.getByRole('button', { name: 'onboarding.actions.skip' })
    );

    await waitFor(() => {
      expect(mockUpdateOnboarding).toHaveBeenCalledWith({
        onboardingCompleted: true,
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('replay receiver'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'onboarding.actions.skip' })
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(mockUpdateOnboarding).toHaveBeenCalledTimes(1);
  });

  test('falls back cleanly when profile loading fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockProfileGet.mockRejectedValueOnce(new Error('profile failed'));

    renderController('DONOR');

    await waitFor(() => {
      expect(screen.getByTestId('donor-replay-flag')).toHaveTextContent('true');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    console.error.mockRestore();
  });

  test('keeps body scrolling locked only while the tutorial is active', async () => {
    mockProfileGet.mockResolvedValueOnce({
      data: { onboardingCompleted: false },
    });

    renderController('DONOR');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(
      screen.getByRole('button', { name: 'onboarding.actions.skip' })
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(document.body.style.overflow).toBe('');
  });

  test('clears the target highlight for centered steps without selectors', async () => {
    renderController('RECEIVER');

    await waitFor(() => {
      expect(screen.getByTestId('receiver-replay-flag')).toHaveTextContent(
        'true'
      );
    });

    fireEvent.click(screen.getByText('replay receiver'));

    for (let index = 0; index < 7; index += 1) {
      fireEvent.click(
        screen.getByRole('button', { name: 'onboarding.actions.next' })
      );
    }

    expect(
      await screen.findByText('onboarding.receiver.steps.done.title')
    ).toBeInTheDocument();
    expect(
      document.querySelector('.onboarding-tour__highlight')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveClass('is-centered');
  });
});
