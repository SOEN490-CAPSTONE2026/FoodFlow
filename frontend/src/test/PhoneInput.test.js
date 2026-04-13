import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhoneInput from '../components/PhoneInput';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

describe('PhoneInput', () => {
  test('renders with default country and custom placeholder', () => {
    render(
      <PhoneInput
        value=""
        onChange={jest.fn()}
        placeholder="forgotPasswordPage.phonePlaceholder"
      />
    );

    expect(
      screen.getByPlaceholderText('forgotPasswordPage.phonePlaceholder')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+1/i })).toBeInTheDocument();
  });

  test('updates parent value using selected country code while typing', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<PhoneInput value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('phoneInput.placeholder');

    await user.type(input, '5145551234');

    expect(onChange).toHaveBeenLastCalledWith('+15145551234');
    expect(screen.getByText('+15145551234')).toBeInTheDocument();
  });

  test('parses initial E.164 value and sets selected country and local number', () => {
    render(<PhoneInput value="+447911123456" onChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: /\+44/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('7911123456')).toBeInTheDocument();
  });

  test('opens dropdown, filters countries, and shows no results state', async () => {
    const user = userEvent.setup();
    render(<PhoneInput value="" onChange={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /\+1/i }));
    const search = screen.getByPlaceholderText('phoneInput.searchCountry');
    await user.type(search, 'zzzz-no-country');

    expect(screen.getByText('phoneInput.noCountries')).toBeInTheDocument();
  });

  test('selecting country keeps current number and emits updated full number', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<PhoneInput value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('phoneInput.placeholder');

    await user.type(input, '1234567');
    await user.click(screen.getByRole('button', { name: /\+1/i }));
    await user.type(
      screen.getByPlaceholderText('phoneInput.searchCountry'),
      'france'
    );
    await user.click(screen.getByRole('button', { name: /france/i }));

    expect(onChange).toHaveBeenLastCalledWith('+331234567');
  }, 15000);

  test('closes dropdown when clicking outside and supports disabled state', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PhoneInput value="" onChange={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /\+1/i }));
    expect(
      screen.getByPlaceholderText('phoneInput.searchCountry')
    ).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(
      screen.queryByPlaceholderText('phoneInput.searchCountry')
    ).not.toBeInTheDocument();

    rerender(<PhoneInput value="" onChange={jest.fn()} disabled />);
    expect(screen.getByRole('button', { name: /\+1/i })).toBeDisabled();
    expect(
      screen.getByPlaceholderText('phoneInput.placeholder')
    ).toBeDisabled();
  });
});
