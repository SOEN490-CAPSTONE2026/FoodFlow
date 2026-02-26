import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarOAuthSuccess from '../CalendarOAuthSuccess';

// Mock the CSS import
jest.mock('../../style/CalendarOAuthSuccess.css', () => ({}));

describe('CalendarOAuthSuccess Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock window.close
    global.window.close = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Render', () => {
    it('should render success message', () => {
      render(<CalendarOAuthSuccess />);

      expect(
        screen.getByText('Calendar Connected Successfully!')
      ).toBeInTheDocument();
    });

    it('should render Google Calendar message', () => {
      render(<CalendarOAuthSuccess />);

      expect(
        screen.getByText('Your Google Calendar has been connected to FoodFlow.')
      ).toBeInTheDocument();
    });

    it('should render sync capabilities message', () => {
      render(<CalendarOAuthSuccess />);

      expect(
        screen.getByText(
          'You can now sync your donation pickups and appointments automatically.'
        )
      ).toBeInTheDocument();
    });

    it('should display success icon', () => {
      render(<CalendarOAuthSuccess />);

      const icon = screen.getByText('✓');
      expect(icon).toBeInTheDocument();
    });

    it('should start countdown at 3 seconds', () => {
      render(<CalendarOAuthSuccess />);

      expect(
        screen.getByText(/Closing this window in 3 seconds/)
      ).toBeInTheDocument();
    });
  });

  describe('Countdown Timer', () => {
    it('should countdown from 3 to 2 seconds', async () => {
      render(<CalendarOAuthSuccess />);

      expect(
        screen.getByText(/Closing this window in 3 seconds/)
      ).toBeInTheDocument();

      // Advance 1 second
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(
          screen.getByText(/Closing this window in 2 seconds/)
        ).toBeInTheDocument();
      });
    });

    it('should countdown from 2 to 1 second', async () => {
      const { act } = require('@testing-library/react');

      const { container } = render(<CalendarOAuthSuccess />);

      // Advance 2 seconds
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const closingMessage = container.querySelector('.closing-message');
        expect(closingMessage).toBeInTheDocument();
        expect(closingMessage.textContent).toMatch(/1/);
        expect(closingMessage.textContent).toMatch(/second/);
        expect(closingMessage.textContent).not.toMatch(/seconds/);
      });
    });

    it('should use singular "second" when countdown is 1', async () => {
      const { act } = require('@testing-library/react');

      const { container } = render(<CalendarOAuthSuccess />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const closingMessage = container.querySelector('.closing-message');
        expect(closingMessage.textContent).not.toMatch(/seconds/);
        expect(closingMessage.textContent).toMatch(/second/);
      });
    });

    it('should use plural "seconds" when countdown is not 1', () => {
      render(<CalendarOAuthSuccess />);

      const text = screen.getByText(/Closing this window in 3 seconds/);
      expect(text.textContent).toMatch(/seconds/);
    });

    it('should countdown properly through all states', async () => {
      const { act } = require('@testing-library/react');

      const { container } = render(<CalendarOAuthSuccess />);

      // Initial state: 3 seconds
      let closingMessage = container.querySelector('.closing-message');
      expect(closingMessage.textContent).toMatch(/3/);
      expect(closingMessage.textContent).toMatch(/seconds/);

      // After 1 second: 2 seconds
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      await waitFor(() => {
        closingMessage = container.querySelector('.closing-message');
        expect(closingMessage.textContent).toMatch(/2/);
        expect(closingMessage.textContent).toMatch(/seconds/);
      });

      // After 2 seconds total: 1 second
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      await waitFor(() => {
        closingMessage = container.querySelector('.closing-message');
        expect(closingMessage.textContent).toMatch(/1/);
        expect(closingMessage.textContent).not.toMatch(/seconds/);
        expect(closingMessage.textContent).toMatch(/second/);
      });
    });
  });

  describe('Window Closing', () => {
    it('should close window after 3 seconds', async () => {
      render(<CalendarOAuthSuccess />);

      expect(global.window.close).not.toHaveBeenCalled();

      // Advance full 3 seconds
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(global.window.close).toHaveBeenCalled();
      });
    });

    it('should not close window before countdown completes', async () => {
      render(<CalendarOAuthSuccess />);

      // Advance 1 second
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(global.window.close).not.toHaveBeenCalled();
      });

      // Advance another second (2 seconds total)
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(global.window.close).not.toHaveBeenCalled();
      });
    });

    it('should close window exactly at countdown completion', async () => {
      render(<CalendarOAuthSuccess />);

      // Advance to just before completion
      jest.advanceTimersByTime(2999);
      expect(global.window.close).not.toHaveBeenCalled();

      // Advance to completion
      jest.advanceTimersByTime(1);

      await waitFor(() => {
        expect(global.window.close).toHaveBeenCalled();
      });
    });
  });

  describe('Component Cleanup', () => {
    it('should clear interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = render(<CalendarOAuthSuccess />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it('should not throw error when unmounted before countdown completes', () => {
      const { unmount } = render(<CalendarOAuthSuccess />);

      jest.advanceTimersByTime(1000);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('UI Structure', () => {
    it('should have correct container class', () => {
      const { container } = render(<CalendarOAuthSuccess />);

      const containerDiv = container.querySelector('.calendar-oauth-container');
      expect(containerDiv).toBeInTheDocument();
    });

    it('should have correct card class', () => {
      const { container } = render(<CalendarOAuthSuccess />);

      const cardDiv = container.querySelector('.calendar-oauth-card');
      expect(cardDiv).toBeInTheDocument();
    });

    it('should have success icon with correct class', () => {
      const { container } = render(<CalendarOAuthSuccess />);

      const iconDiv = container.querySelector('.oauth-icon.success-icon');
      expect(iconDiv).toBeInTheDocument();
    });

    it('should have calendar oauth message class', () => {
      const { container } = render(<CalendarOAuthSuccess />);

      const messageP = container.querySelector('.calendar-oauth-message');
      expect(messageP).toBeInTheDocument();
    });

    it('should have closing message class', () => {
      const { container } = render(<CalendarOAuthSuccess />);

      const closingP = container.querySelector('.closing-message');
      expect(closingP).toBeInTheDocument();
    });
  });

  describe('Timer Behavior', () => {
    it('should update state every second', async () => {
      const { act } = require('@testing-library/react');

      const { container } = render(<CalendarOAuthSuccess />);

      let closingMessage = container.querySelector('.closing-message');
      expect(closingMessage.textContent).toMatch(/3/);

      // Wait 1 second and check update
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        closingMessage = container.querySelector('.closing-message');
        expect(closingMessage.textContent).toMatch(/2/);
      });

      // Wait another second and check update
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        closingMessage = container.querySelector('.closing-message');
        expect(closingMessage.textContent).toMatch(/1/);
        expect(closingMessage.textContent).not.toMatch(/seconds/);
      });
    });

    it('should stop countdown at 0', async () => {
      render(<CalendarOAuthSuccess />);

      // Advance to completion
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(global.window.close).toHaveBeenCalled();
      });

      // Verify countdown doesn't go negative
      const closingMessage = screen.queryByText(/Closing this window in -/);
      expect(closingMessage).not.toBeInTheDocument();
    });
  });

  describe('Multiple Renders', () => {
    it('should handle multiple component instances independently', async () => {
      const { act } = require('@testing-library/react');

      const { unmount: unmount1, container: container1 } = render(
        <CalendarOAuthSuccess />
      );
      const { unmount: unmount2, container: container2 } = render(
        <CalendarOAuthSuccess />
      );

      // Both should countdown independently
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Unmount first instance
      unmount1();

      // Second instance should still work
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const closingMessage = container2.querySelector('.closing-message');
        expect(closingMessage).toBeInTheDocument();
        expect(closingMessage.textContent).toMatch(/1/);
        expect(closingMessage.textContent).not.toMatch(/seconds/);
      });

      unmount2();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid timer updates', async () => {
      const { act } = require('@testing-library/react');

      render(<CalendarOAuthSuccess />);

      // Rapidly advance time
      await act(async () => {
        for (let i = 0; i < 3; i++) {
          jest.advanceTimersByTime(1000);
        }
      });

      await waitFor(() => {
        expect(global.window.close).toHaveBeenCalled();
      });
    });

    it('should handle window.close being unavailable', async () => {
      const originalClose = global.window.close;
      delete global.window.close;

      render(<CalendarOAuthSuccess />);

      jest.advanceTimersByTime(3000);

      // Should not throw error even if window.close is undefined
      await waitFor(() => {
        expect(true).toBe(true);
      });

      global.window.close = originalClose;
    });
  });

  describe('Content Accuracy', () => {
    it('should display all required text content', () => {
      render(<CalendarOAuthSuccess />);

      // Verify all text is present
      expect(
        screen.getByText('Calendar Connected Successfully!')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Your Google Calendar has been connected to FoodFlow.')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'You can now sync your donation pickups and appointments automatically.'
        )
      ).toBeInTheDocument();
      expect(screen.getByText(/Closing this window in/)).toBeInTheDocument();
    });

    it('should use h2 for main heading', () => {
      render(<CalendarOAuthSuccess />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Calendar Connected Successfully!');
    });
  });
});
