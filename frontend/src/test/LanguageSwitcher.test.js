import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LanguageSwitcher from '../components/LanguageSwitcher';

// Mock the SVG imports
jest.mock('../assets/lang-icons/EN.svg', () => 'en-icon.svg');
jest.mock('../assets/lang-icons/FR.svg', () => 'fr-icon.svg');
jest.mock('../assets/lang-icons/ES.svg', () => 'es-icon.svg');
jest.mock('../assets/lang-icons/ZH.svg', () => 'zh-icon.svg');
jest.mock('../assets/lang-icons/AR.svg', () => 'ar-icon.svg');
jest.mock('../assets/lang-icons/PR.svg', () => 'pr-icon.svg');

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    // Clear any existing toast elements before each test
    document.body.innerHTML = '';
    
    // Mock localStorage with a token
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'jwtToken') return 'mock-token';
      return null;
    });
    Storage.prototype.setItem = jest.fn();
    
    // Mock fetch to return a successful response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test('renders with default language (English)', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { expanded: false });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  test('toggles dropdown when button is clicked', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('displays all 6 languages in dropdown', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    
    const languageOptions = screen.getAllByRole('option');
    expect(languageOptions).toHaveLength(6);
    
    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.getByText('Português')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
  });

  test('filters languages based on search query', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    
    const searchInput = screen.getByPlaceholderText('Search languages...');
    fireEvent.change(searchInput, { target: { value: 'fren' } });
    
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(screen.getByText('Français')).toBeInTheDocument();
  });

  test('filters languages by native name', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    
    const searchInput = screen.getByPlaceholderText('Search languages...');
    fireEvent.change(searchInput, { target: { value: '中' } });
    
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  test('shows "No languages found" when search has no results', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    
    const searchInput = screen.getByPlaceholderText('Search languages...');
    fireEvent.change(searchInput, { target: { value: 'xyz123' } });
    
    expect(screen.getByText('No languages found')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  test('selects a language and closes dropdown', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    
    const frenchOption = screen.getByText('Français');
    fireEvent.click(frenchOption);
    
    // Dropdown should be closed
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    
    // Selected language should be displayed
    expect(screen.getByText('Français')).toBeInTheDocument();
  });

  test('displays check icon next to selected language', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    
    const englishOption = screen.getByRole('option', { selected: true });
    expect(englishOption).toHaveClass('selected');
    
    // Check that selected attribute is set correctly
    expect(englishOption).toHaveAttribute('aria-selected', 'true');
  });

  test('updates selected language when clicking different option', () => {
    render(<LanguageSwitcher />);
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'));
    
    // Click Spanish
    const spanishOption = screen.getByText('Español');
    fireEvent.click(spanishOption);
    
    // Open dropdown again
    fireEvent.click(screen.getByRole('button'));
    
    // Spanish should now be selected
    const options = screen.getAllByRole('option');
    const selectedOption = options.find(opt => opt.getAttribute('aria-selected') === 'true');
    expect(selectedOption).toHaveTextContent('Español');
  });

  test('clears search query when dropdown is closed', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    
    const searchInput = screen.getByPlaceholderText('Search languages...');
    fireEvent.change(searchInput, { target: { value: 'Spanish' } });
    expect(searchInput).toHaveValue('Spanish');
    
    // Close dropdown
    fireEvent.click(screen.getByRole('button'));
    
    // Open again
    fireEvent.click(screen.getByRole('button'));
    
    // Search should be cleared
    const newSearchInput = screen.getByPlaceholderText('Search languages...');
    expect(newSearchInput).toHaveValue('');
  });

  test('closes dropdown when clicking overlay', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    
    const overlay = document.querySelector('.language-overlay');
    expect(overlay).toBeInTheDocument();
    
    fireEvent.click(overlay);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('creates toast message when language is selected', async () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Français'));
    
    // Wait for the async operation to complete
    await waitFor(() => {
      const toast = document.querySelector('.language-toast');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveTextContent('Language switched to Français');
    }, { timeout: 3000 });
  });

  test('console logs selected language code', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('中文'));
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Language selected: zh');
    });
    
    consoleSpy.mockRestore();
  });

  test('search input is case insensitive', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    
    const searchInput = screen.getByPlaceholderText('Search languages...');
    fireEvent.change(searchInput, { target: { value: 'ARABIC' } });
    
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(screen.getByText('العربية')).toBeInTheDocument();
  });

  test('displays language icons for all languages', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    
    // Images with aria-hidden="true" have presentation role
    const images = document.querySelectorAll('img[aria-hidden="true"]');
    // 1 in the button + 6 in the dropdown
    expect(images.length).toBeGreaterThanOrEqual(6);
  });

  test('clears search query when selecting a language', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    
    const searchInput = screen.getByPlaceholderText('Search languages...');
    fireEvent.change(searchInput, { target: { value: 'Port' } });
    
    fireEvent.click(screen.getByText('Português'));
    
    // Open dropdown again to check search is cleared
    fireEvent.click(screen.getByRole('button'));
    
    const newSearchInput = screen.getByPlaceholderText('Search languages...');
    expect(newSearchInput).toHaveValue('');
  });
});
