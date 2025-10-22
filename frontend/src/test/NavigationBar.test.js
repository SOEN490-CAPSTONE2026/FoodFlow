import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';

// Mock logo import
jest.mock("../assets/Logo.png", () => "test-logo.png");

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

describe('NavigationBar', () => {
  const mockLogout = jest.fn();
  
  const renderWithProviders = (isLoggedIn = false, locationPath = '/') => {
    mockUseLocation.mockReturnValue({
      pathname: locationPath,
      state: null
    });

    return render(
      <AuthContext.Provider value={{ isLoggedIn, logout: mockLogout }}>
        <BrowserRouter>
          <NavigationBar />
        </BrowserRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogout.mockClear();
    window.scrollTo.mockClear();
    mockUseLocation.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders NavigationBar with logo', () => {
    renderWithProviders();
    
    const logo = screen.getByAltText('Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'test-logo.png');
  });

  test('renders navigation links', () => {
    renderWithProviders();
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('FAQs')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
  });

  test('shows login and register buttons in desktop view when user is not logged in', () => {
    renderWithProviders(false);
    
    // Use getAllByText due to having multiple instances (desktop and mobile)
    const loginButtons = screen.getAllByText('Login');
    const registerButtons = screen.getAllByText('Register');
    
    expect(loginButtons.length).toBeGreaterThan(0);
    expect(registerButtons.length).toBeGreaterThan(0);
  });

  test('shows logout button when user is logged in', () => {
    renderWithProviders(true);
    
    // Use getAllByText since there are multiple instances
    const logoutButtons = screen.getAllByText('Logout');
    const loginButtons = screen.queryAllByText('Login');
    const registerButtons = screen.queryAllByText('Register');
    
    expect(logoutButtons.length).toBeGreaterThan(0);
    expect(loginButtons).toHaveLength(0);
    expect(registerButtons).toHaveLength(0);
  });

  test('desktop logout button calls logout function', () => {
    renderWithProviders(true);
    
    // Get the desktop logout button 
    const buttonsContainer = document.querySelector('.buttons');
    const logoutButton = buttonsContainer.querySelector('.logout-button');
    
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('desktop login button navigates to login page', () => {
    renderWithProviders(false);
    
    // Get the desktop login button 
    const buttonsContainer = document.querySelector('.buttons');
    const loginButton = buttonsContainer.querySelector('.login-button');
    
    fireEvent.click(loginButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('desktop register button navigates to register page', () => {
    renderWithProviders(false);
    
    // Get the desktop register button 
    const buttonsContainer = document.querySelector('.buttons');
    const registerButton = buttonsContainer.querySelector('.signup-button');
    
    fireEvent.click(registerButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  test('mobile menu toggle works', () => {
    renderWithProviders(false);
    
    // Find the menu toggle by its class 
    const menuToggle = document.querySelector('.menu-toggle');
    fireEvent.click(menuToggle);
    
    // Menu should be visible after click
    const menu = document.querySelector('.menu');
    expect(menu).toHaveClass('active');
    
    fireEvent.click(menuToggle);
    expect(menu).not.toHaveClass('active');
  });

  test('mobile logout button calls logout function', () => {
    renderWithProviders(true);
    
    // Open mobile menu first
    const menuToggle = document.querySelector('.menu-toggle');
    fireEvent.click(menuToggle);
    
    // Get the mobile logout button
    const mobileButtonsContainer = document.querySelector('.mobile-buttons');
    const logoutButton = mobileButtonsContainer.querySelector('.logout-button');
    
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('logo click navigates to home when not on home page', () => {
    renderWithProviders(false, '/some-other-page');
    
    const logo = screen.getByAltText('Logo').closest('div');
    fireEvent.click(logo);
    
    expect(mockNavigate).toHaveBeenCalledWith('/', { 
      state: { 
        from: undefined, 
        scrollTo: 'home' 
      } 
    });
  });

  test('logo click scrolls to top when already on home page', () => {
    renderWithProviders(false, '/');
    
    const logo = screen.getByAltText('Logo').closest('div');
    fireEvent.click(logo);
    
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth'
    });
  });

  test('navigation links have click handlers and correct hrefs', () => {
    renderWithProviders(false, '/');
    
    const homeLink = screen.getByText('Home');
    const howItWorksLink = screen.getByText('How it works');
    const aboutLink = screen.getByText('About Us');
    const faqsLink = screen.getByText('FAQs');
    const contactLink = screen.getByText('Contact Us');
    
    // Verify the links have correct href attributes
    expect(homeLink).toHaveAttribute('href', '#home');
    expect(howItWorksLink).toHaveAttribute('href', '#how-it-works');
    expect(aboutLink).toHaveAttribute('href', '#about');
    expect(faqsLink).toHaveAttribute('href', '#faqs');
    expect(contactLink).toHaveAttribute('href', '#contact');
    
    // Test that clicking doesn't throw errors
    expect(() => {
      fireEvent.click(homeLink);
      fireEvent.click(howItWorksLink);
      fireEvent.click(aboutLink);
    }).not.toThrow();
  });

  test('navigation links navigate to home with scroll state when not on home page', () => {
    // Mock being on a different page
    renderWithProviders(false, '/login');
    
    const homeLink = screen.getByText('Home');
    fireEvent.click(homeLink);
    
    // Should navigate to home with scroll state for the home section
    expect(mockNavigate).toHaveBeenCalledWith('/', {
      state: { scrollTo: 'home' }
    });
  });

  test('navigation links scroll when already on home page', () => {
    // Mock being on home page
    renderWithProviders(false, '/');
    
    // Mock element and scroll behavior
    const mockElement = {
      getBoundingClientRect: () => ({ top: 100 }),
    };
    
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);
    
    Object.defineProperty(window, 'pageYOffset', {
      writable: true,
      value: 0
    });
    
    //Fake timers being used to handle the setTimeout in scrollToSection
    jest.useFakeTimers();
    
    const homeLink = screen.getByText('Home');
    fireEvent.click(homeLink);
    
    // Advance timers to trigger the setTimeout
    jest.advanceTimersByTime(150);
    
    // Should call scrollTo with calculated position
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 20,
      behavior: 'smooth'
    });
    
    jest.useRealTimers();
  });
});