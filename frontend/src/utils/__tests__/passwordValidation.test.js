import {
  validatePassword,
  getPasswordPolicyDescription,
} from '../passwordValidation';

describe('validatePassword', () => {
  test('should return no errors for valid password', () => {
    const errors = validatePassword('SecurePass123!');
    expect(errors).toEqual([]);
  });

  test('should reject password shorter than 10 characters', () => {
    const errors = validatePassword('Short1!');
    expect(errors).toContain('Password must be at least 10 characters long');
  });

  test('should reject password without uppercase letter', () => {
    const errors = validatePassword('lowercase123!');
    expect(errors).toContain(
      'Password must contain at least one uppercase letter'
    );
  });

  test('should reject password without lowercase letter', () => {
    const errors = validatePassword('UPPERCASE123!');
    expect(errors).toContain(
      'Password must contain at least one lowercase letter'
    );
  });

  test('should reject password without digit', () => {
    const errors = validatePassword('NoDigitsHere!');
    expect(errors).toContain('Password must contain at least one digit');
  });

  test('should reject password without special character', () => {
    const errors = validatePassword('NoSpecial123');
    expect(errors).toContainEqual(
      expect.stringContaining(
        'Password must contain at least one special character'
      )
    );
  });

  test('should reject common passwords', () => {
    const commonPasswords = ['password', 'password123', '12345678', 'qwerty'];
    commonPasswords.forEach(pwd => {
      const errors = validatePassword(pwd);
      expect(errors.some(err => err.includes('too common'))).toBe(true);
    });
  });

  test('should reject empty password', () => {
    const errors = validatePassword('');
    expect(errors).toContain('Password is required');
  });

  test('should reject null password', () => {
    const errors = validatePassword(null);
    expect(errors).toContain('Password is required');
  });

  test('should reject undefined password', () => {
    const errors = validatePassword(undefined);
    expect(errors).toContain('Password is required');
  });

  test('should return multiple errors for very weak password', () => {
    const errors = validatePassword('abc');
    expect(errors.length).toBeGreaterThanOrEqual(4);
    expect(errors).toContainEqual(
      expect.stringContaining('Password must be at least 10 characters')
    );
    expect(errors).toContainEqual(
      expect.stringContaining(
        'Password must contain at least one uppercase letter'
      )
    );
    expect(errors).toContainEqual(
      expect.stringContaining('Password must contain at least one digit')
    );
    expect(errors).toContainEqual(
      expect.stringContaining(
        'Password must contain at least one special character'
      )
    );
  });

  test('should accept password with various special characters', () => {
    const specialChars = [
      '!',
      '@',
      '#',
      '$',
      '%',
      '^',
      '&',
      '*',
      '(',
      ')',
      '_',
      '+',
      '-',
      '=',
      '[',
      ']',
      '{',
      '}',
      '|',
      ';',
      ':',
      ',',
      '.',
      '<',
      '>',
      '?',
    ];
    specialChars.forEach(char => {
      const password = `SecurePass123${char}`;
      const errors = validatePassword(password);
      expect(errors).toEqual([]);
    });
  });

  test('should accept exactly 10 character password with all requirements', () => {
    const errors = validatePassword('Secure12!@');
    expect(errors).toEqual([]);
  });

  test('should accept very long password', () => {
    const longPassword = 'A'.repeat(50) + 'a'.repeat(50) + '1'.repeat(10) + '!';
    const errors = validatePassword(longPassword);
    expect(errors).toEqual([]);
  });

  test('should be case-insensitive for common password check', () => {
    const errors1 = validatePassword('PASSWORD');
    const errors2 = validatePassword('password');
    const errors3 = validatePassword('PaSsWoRd');

    expect(errors1.some(err => err.includes('too common'))).toBe(true);
    expect(errors2.some(err => err.includes('too common'))).toBe(true);
    expect(errors3.some(err => err.includes('too common'))).toBe(true);
  });
});

describe('getPasswordPolicyDescription', () => {
  test('should return array of policy requirements', () => {
    const description = getPasswordPolicyDescription();
    expect(Array.isArray(description)).toBe(true);
    expect(description.length).toBeGreaterThan(0);
  });

  test('should include all policy requirements', () => {
    const description = getPasswordPolicyDescription();
    const descriptionText = description.join(' ');

    expect(descriptionText).toContain('10 characters');
    expect(descriptionText).toContain('uppercase');
    expect(descriptionText).toContain('lowercase');
    expect(descriptionText).toContain('digit');
    expect(descriptionText).toContain('special character');
    expect(descriptionText).toContain('common password');
  });
});
