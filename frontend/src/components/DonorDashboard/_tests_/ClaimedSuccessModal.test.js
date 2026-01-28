import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ClaimedSuccessModal from '../ClaimedSuccessModal';

describe('ClaimedSuccessModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={false} onClose={mockOnClose} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      render(<ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('claimedSuccessModal.title')).toBeInTheDocument();
      expect(screen.getByText('claimedSuccessModal.subtitle')).toBeInTheDocument();
    });

    it('should render the success title', () => {
      render(<ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />);

      const title = screen.getByText('claimedSuccessModal.title');
      expect(title).toHaveClass('claimed-success-title');
    });

    it('should render the success subtitle', () => {
      render(<ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />);

      const subtitle = screen.getByText('claimedSuccessModal.subtitle');
      expect(subtitle).toHaveClass('claimed-success-subtitle');
    });

    it('should render the heart SVG icon', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      // Target the heart SVG in the icon container, not the close button X icon
      const iconContainer = container.querySelector('.claimed-success-icon');
      const svg = iconContainer.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '160');
      expect(svg).toHaveAttribute('height', '160');
      expect(svg).toHaveAttribute('viewBox', '0 0 160 160');
    });

    it('should render the close button with X icon', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      const closeButton = container.querySelector('.claimed-success-close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe('BUTTON');
      const svg = closeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render overlay with correct class', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      const overlay = container.querySelector('.claimed-success-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('should render modal content with correct class', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      const content = container.querySelector('.claimed-success-content');
      expect(content).toBeInTheDocument();
    });

    it('should render the icon container', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      const iconContainer = container.querySelector('.claimed-success-icon');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      const overlay = container.querySelector('.claimed-success-overlay');
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      const closeButton = container.querySelector('.claimed-success-close');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup();
      render(<ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />);

      const title = screen.getByText('claimedSuccessModal.title');
      await user.click(title);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when clicking inside modal content area', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      const content = container.querySelector('.claimed-success-content');
      await user.click(content);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when clicking the heart SVG icon', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      // Click the heart icon in the content area, not the close button's X icon
      const iconContainer = container.querySelector('.claimed-success-icon');
      const svg = iconContainer.querySelector('svg');
      await user.click(svg);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when clicking the subtitle', async () => {
      const user = userEvent.setup();
      render(<ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />);

      const subtitle = screen.getByText('claimedSuccessModal.subtitle');
      await user.click(subtitle);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Props validation', () => {
    it('should handle missing onClose prop gracefully', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} />
      );

      expect(container.querySelector('.claimed-success-overlay')).toBeInTheDocument();
    });

    it('should re-render when isOpen prop changes from false to true', () => {
      const { rerender } = render(
        <ClaimedSuccessModal isOpen={false} onClose={mockOnClose} />
      );

      expect(screen.queryByText('claimedSuccessModal.title')).not.toBeInTheDocument();

      rerender(<ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('claimedSuccessModal.title')).toBeInTheDocument();
    });

    it('should re-render when isOpen prop changes from true to false', () => {
      const { rerender, container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('claimedSuccessModal.title')).toBeInTheDocument();

      rerender(<ClaimedSuccessModal isOpen={false} onClose={mockOnClose} />);

      expect(container.firstChild).toBeNull();
    });

    it('should accept a different onClose function', async () => {
      const newOnClose = jest.fn();
      const user = userEvent.setup();
      
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={newOnClose} />
      );

      const closeButton = container.querySelector('.claimed-success-close');
      await user.click(closeButton);

      expect(newOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have a close button that is focusable', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      const closeButton = container.querySelector('.claimed-success-close');
      expect(closeButton).toBeInTheDocument();
      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });

    it('should have close button with proper structure', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      const closeButton = container.querySelector('.claimed-success-close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe('BUTTON');
      // Button contains an SVG icon for visual indication
      expect(closeButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should render text content that is accessible', () => {
      render(<ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('claimedSuccessModal.title')).toBeVisible();
      expect(screen.getByText('claimedSuccessModal.subtitle')).toBeVisible();
    });
  });

  describe('SVG Icon Details', () => {
    it('should render SVG with correct fill color', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      // Target the heart icon's path element which has the fill color
      const iconContainer = container.querySelector('.claimed-success-icon');
      const path = iconContainer.querySelector('svg path');
      expect(path).toHaveAttribute('fill', '#A7F3D0');
    });

    it('should render SVG path element', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      const path = container.querySelector('svg path');
      expect(path).toBeInTheDocument();
    });

    it('should render heart SVG with none fill on svg element', () => {
      const { container } = render(
        <ClaimedSuccessModal isOpen={true} onClose={mockOnClose} />
      );

      // Heart icon SVG has fill="none" on the svg element, fill is on the path
      const iconContainer = container.querySelector('.claimed-success-icon');
      const svg = iconContainer.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
    });
  });

  describe('Multiple instances', () => {
    it('should handle multiple modals with different states', () => {
      const onClose1 = jest.fn();
      const onClose2 = jest.fn();

      const { rerender } = render(
        <>
          <ClaimedSuccessModal isOpen={true} onClose={onClose1} />
          <ClaimedSuccessModal isOpen={false} onClose={onClose2} />
        </>
      );

      // Only one modal should be visible
      expect(screen.getAllByText('claimedSuccessModal.title')).toHaveLength(1);

      // Swap states
      rerender(
        <>
          <ClaimedSuccessModal isOpen={false} onClose={onClose1} />
          <ClaimedSuccessModal isOpen={true} onClose={onClose2} />
        </>
      );

      // Still only one modal should be visible
      expect(screen.getAllByText('claimedSuccessModal.title')).toHaveLength(1);
    });
  });
});
