import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReceiverWelcome from '../ReceiverWelcome';

describe('ReceiverWelcome', () => {
  let mockObserve;
  let mockDisconnect;
  let mockUnobserve;

  beforeEach(() => {
    // Reset mocks before each test
    mockObserve = jest.fn();
    mockDisconnect = jest.fn();
    mockUnobserve = jest.fn();

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn(function (callback, options) {
      this.observe = mockObserve;
      this.disconnect = mockDisconnect;
      this.unobserve = mockUnobserve;
      this.callback = callback;
      this.options = options;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders main header with title and description', () => {
    render(<ReceiverWelcome />);

    expect(screen.getByText('Find Food Near You')).toBeInTheDocument();
    expect(
      screen.getByText(/We help organizations connect with available food/i)
    ).toBeInTheDocument();
  });

  test('renders notice tip about pickup hours', () => {
    render(<ReceiverWelcome />);

    expect(
      screen.getByText(
        /Tip: Set your pickup hours and capacity to get matched faster/i
      )
    ).toBeInTheDocument();
  });

  test('renders search the map section with icon and text', () => {
    render(<ReceiverWelcome />);

    expect(screen.getByText('Search the map')).toBeInTheDocument();
    expect(
      screen.getByText(/Browse current listings and filter by category/i)
    ).toBeInTheDocument();
    expect(screen.getByText('🗺️')).toBeInTheDocument();
  });

  test('renders map search link with correct href', () => {
    render(<ReceiverWelcome />);

    const mapLink = screen.getByRole('link', { name: /open map & search/i });
    expect(mapLink).toBeInTheDocument();
    expect(mapLink).toHaveAttribute('href', '/receiver/search#org-search');
  });

  test('renders assistance section with email contact', () => {
    render(<ReceiverWelcome />);

    expect(screen.getByText('Need assistance?')).toBeInTheDocument();
    expect(screen.getByText(/Email us at/i)).toBeInTheDocument();

    const emailLink = screen.getByRole('link', {
      name: /foodflow.group@gmail.com/i,
    });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute(
      'href',
      'mailto:foodflow.group@gmail.com'
    );
  });

  test('renders FAQ section with link', () => {
    render(<ReceiverWelcome />);

    expect(
      screen.getByText(/New here\? Read common questions/i)
    ).toBeInTheDocument();

    const faqLink = screen.getByRole('link', { name: /view faqs/i });
    expect(faqLink).toBeInTheDocument();
    expect(faqLink).toHaveAttribute('href', '/receiver/faq');
  });

  test('renders all required CSS classes', () => {
    const { container } = render(<ReceiverWelcome />);

    expect(container.querySelector('.receiver-welcome')).toBeInTheDocument();
    expect(container.querySelector('.rw-header')).toBeInTheDocument();
    expect(container.querySelector('.rw-notice')).toBeInTheDocument();
    expect(container.querySelector('.rw-content')).toBeInTheDocument();
    expect(container.querySelectorAll('.rw-section').length).toBe(2);
  });

  test('renders primary and secondary buttons with correct classes', () => {
    const { container } = render(<ReceiverWelcome />);

    expect(container.querySelector('.rw-btn.primary')).toBeInTheDocument();
    expect(container.querySelector('.rw-btn.secondary')).toBeInTheDocument();
  });

  test('initializes IntersectionObserver on mount', () => {
    render(<ReceiverWelcome />);

    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.1 }
    );
  });

  test('observes header, notice, and section elements', () => {
    render(<ReceiverWelcome />);

    // Should observe header (1) + notice (1) + sections (2) = 4 elements
    expect(mockObserve).toHaveBeenCalledTimes(4);
  });

  test('adds animate-in class when element intersects', async () => {
    const { container } = render(<ReceiverWelcome />);

    const header = container.querySelector('.rw-header');

    // Get the callback that was passed to IntersectionObserver
    const observerInstance = global.IntersectionObserver.mock.instances[0];
    const callback = global.IntersectionObserver.mock.calls[0][0];

    // Simulate intersection
    callback([
      {
        target: header,
        isIntersecting: true,
      },
    ]);

    await waitFor(() => {
      expect(header.classList.contains('animate-in')).toBe(true);
    });
  });

  test('does not add animate-in class when element is not intersecting', () => {
    const { container } = render(<ReceiverWelcome />);

    const header = container.querySelector('.rw-header');

    // Get the callback
    const callback = global.IntersectionObserver.mock.calls[0][0];

    // Simulate no intersection
    callback([
      {
        target: header,
        isIntersecting: false,
      },
    ]);

    expect(header.classList.contains('animate-in')).toBe(false);
  });

  test('disconnects observer on unmount', () => {
    const { unmount } = render(<ReceiverWelcome />);

    unmount();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  test('addToRefs adds new elements to sectionRefs', () => {
    const { container } = render(<ReceiverWelcome />);

    // Both sections should be rendered and observed
    const sections = container.querySelectorAll('.rw-section');
    expect(sections.length).toBe(2);

    // Verify both sections were observed (part of the 4 total observes)
    expect(mockObserve).toHaveBeenCalledTimes(4);
  });

  test('addToRefs does not add null elements', () => {
    render(<ReceiverWelcome />);

    // Should only observe non-null elements (4 total: header, notice, 2 sections)
    expect(mockObserve).toHaveBeenCalledTimes(4);
  });

  test('renders both icon emojis', () => {
    render(<ReceiverWelcome />);

    expect(screen.getByText('🗺️')).toBeInTheDocument();
    expect(screen.getByText('📩')).toBeInTheDocument();
  });

  test('applies animate-on-scroll class to all animated elements', () => {
    const { container } = render(<ReceiverWelcome />);

    const animatedElements = container.querySelectorAll('.animate-on-scroll');
    expect(animatedElements.length).toBe(4); // header, notice, 2 sections
  });

  test('observer callback is called with correct threshold', () => {
    render(<ReceiverWelcome />);

    const options = global.IntersectionObserver.mock.calls[0][1];
    expect(options.threshold).toBe(0.1);
  });

  test('multiple elements can be animated simultaneously', async () => {
    const { container } = render(<ReceiverWelcome />);

    const header = container.querySelector('.rw-header');
    const notice = container.querySelector('.rw-notice');

    const callback = global.IntersectionObserver.mock.calls[0][0];

    // Simulate multiple elements intersecting
    callback([
      { target: header, isIntersecting: true },
      { target: notice, isIntersecting: true },
    ]);

    await waitFor(() => {
      expect(header.classList.contains('animate-in')).toBe(true);
      expect(notice.classList.contains('animate-in')).toBe(true);
    });
  });

  test('only intersecting elements get animated', async () => {
    const { container } = render(<ReceiverWelcome />);

    const header = container.querySelector('.rw-header');
    const notice = container.querySelector('.rw-notice');

    const callback = global.IntersectionObserver.mock.calls[0][0];

    // Simulate only header intersecting
    callback([
      { target: header, isIntersecting: true },
      { target: notice, isIntersecting: false },
    ]);

    await waitFor(() => {
      expect(header.classList.contains('animate-in')).toBe(true);
    });

    expect(notice.classList.contains('animate-in')).toBe(false);
  });

  test('renders icon containers with correct class', () => {
    const { container } = render(<ReceiverWelcome />);

    const icons = container.querySelectorAll('.rw-icon');
    expect(icons.length).toBe(2);
  });

  test('renders small text in FAQ section', () => {
    const { container } = render(<ReceiverWelcome />);

    const smallText = container.querySelector('.rw-small');
    expect(smallText).toBeInTheDocument();
    expect(smallText.textContent).toContain('New here?');
  });
});
