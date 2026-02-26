// Password validation utility - matches backend password policy
export const validatePassword = password => {
  const errors = [];

  if (!password || password.length === 0) {
    errors.push('Password is required');
    return errors;
  }

  // Minimum length (10 characters)
  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long');
  }

  // Uppercase requirement
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Lowercase requirement
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Digit requirement
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  // Special character requirement
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push(
      'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)'
    );
  }

  // Common passwords check (basic list - backend has more comprehensive check)
  const commonPasswords = [
    'password',
    'password123',
    '12345678',
    '123456789',
    '1234567890',
    'qwerty',
    'abc123',
    'password1',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    '1234',
    'dragon',
    'master',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push(
      'This password is too common. Please choose a more secure password'
    );
  }

  return errors;
};

// Get password policy description for display
export const getPasswordPolicyDescription = () => {
  return [
    'At least 10 characters long',
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one digit (0-9)',
    'At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)',
    'Not a common password',
  ];
};
