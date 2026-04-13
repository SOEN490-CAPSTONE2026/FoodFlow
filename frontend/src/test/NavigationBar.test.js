import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NavigationBar from '../components/NavigationBar';
import { AuthContext } from '../contexts/AuthContext';

const mockNavigate = jest.fn();
const mockChangeLanguage = jest.fn();
let mockLocation = { pathname: '/', state: null, search: '' };
let mockLanguage = 'en';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: {
      language: mockLanguage,
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

jest.mock('react-icons/fa', () => ({
  FaBars: () => <span data-testid="bars-icon">bars</span>,
  FaTimes: () => <span data-testid="times-icon">times</span>,
}));

describe('NavigationBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockLocation = { pathname: '/', state: null, search: '' };
    mockLanguage = 'en';
    Element.prototype.scrollIntoView = jest.fn();
    jest.spyOn(window.history, 'replaceState');
  });

  afterEach(() => {
    window.history.replaceState.mockRestore();
  });

  const renderNav = (authValue = { isLoggedIn: false, role: null }) =>
    render(
      <AuthContext.Provider value={authValue}>
        <NavigationBar />
      </AuthContext.Provider>
    );

  test('renders logged-out navigation and toggles the menu', () => {
    renderNav();

    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getAllByText('nav.login').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('language.select').length).toBe(2);

    const menuToggle = screen.getByRole('button', { name: 'Toggle menu' });
    expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('times-icon')).toBeInTheDocument();
  });

  test('navigates to login and register and closes the mobile menu', () => {
    renderNav();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle menu' }));
    fireEvent.click(screen.getAllByText('nav.login')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/login');

    fireEvent.click(screen.getByRole('button', { name: 'Toggle menu' }));
    fireEvent.click(screen.getAllByText('nav.register')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/register');

    expect(screen.getByRole('button', { name: 'Toggle menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  test('scrolls on the landing page and updates the hash', () => {
    const section = document.createElement('section');
    section.id = 'about';
    section.scrollIntoView = jest.fn();
    document.body.appendChild(section);

    renderNav();
    fireEvent.click(screen.getByText('nav.about'));

    expect(window.history.replaceState).toHaveBeenCalled();
    expect(section.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  test('stores the target and navigates when jumping to a section from another route', () => {
    mockLocation = {
      pathname: '/login',
      state: { from: '/receiver/browse' },
      search: '?next=1',
    };

    renderNav();
    fireEvent.click(screen.getByText('nav.contact'));

    expect(sessionStorage.getItem('landingScrollTarget')).toBe('contact');
    expect(sessionStorage.getItem('returnFrom')).toBe('/receiver/browse');
    expect(mockNavigate).toHaveBeenCalledWith('/#contact', {
      state: { scrollTo: 'contact', from: '/receiver/browse' },
    });
  });

  test('handles logo clicks both on and off the landing page', () => {
    mockLocation = { pathname: '/privacy', state: null, search: '' };
    const { rerender } = renderNav();

    fireEvent.click(screen.getByAltText('Logo'));
    expect(sessionStorage.getItem('landingScrollTarget')).toBe('home');
    expect(mockNavigate).toHaveBeenCalledWith('/#home', {
      state: { from: undefined, scrollTo: 'home' },
    });

    mockNavigate.mockClear();
    mockLocation = { pathname: '/', state: null, search: '?lang=en' };
    rerender(
      <AuthContext.Provider value={{ isLoggedIn: false, role: null }}>
        <NavigationBar />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByAltText('Logo'));
    expect(window.history.replaceState).toHaveBeenCalled();
  });

  test.each([
    ['RECEIVER', '/receiver/browse'],
    ['DONOR', '/donor'],
    ['ADMIN', '/admin/dashboard'],
    ['OTHER', '/'],
  ])('returns logged-in users to the right dashboard for %s', (role, path) => {
    renderNav({ isLoggedIn: true, role });

    fireEvent.click(screen.getAllByText('nav.returnToDashboard')[0]);
    expect(mockNavigate).toHaveBeenCalledWith(path);
  });

  test('changes language and closes the dropdown when clicking outside', () => {
    renderNav();

    fireEvent.click(screen.getAllByLabelText('language.select')[0]);
    expect(screen.getAllByText('language.french').length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByText('language.french')[0]);
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');

    fireEvent.click(screen.getAllByLabelText('language.select')[0]);
    expect(screen.getAllByText('language.spanish').length).toBeGreaterThan(0);

    fireEvent.mouseDown(document.body);
    expect(screen.queryAllByText('language.spanish')).toHaveLength(0);
  });
});
