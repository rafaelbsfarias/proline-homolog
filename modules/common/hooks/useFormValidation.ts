import { useState } from 'react';
//import { isValidEmail } from '../utils/validators/email';
import { AUTH_MESSAGES } from '../constants/messages';

export interface FormValidationResult {
  isValid: boolean;
  error: string;
}

export function useFormValidation() {
  const [error, setError] = useState('');

  function validateLoginForm(email: string, password: string): FormValidationResult {
    if (!email || !password) {
      setError(AUTH_MESSAGES.FILL_ALL_FIELDS);
      return { isValid: false, error: AUTH_MESSAGES.FILL_ALL_FIELDS };
    }
    // const sanitizedEmail = email.trim();
    // if (!isValidEmail(sanitizedEmail)) {
    //   setError(AUTH_MESSAGES.INVALID_EMAIL);
    //   return { isValid: false, error: AUTH_MESSAGES.INVALID_EMAIL };
    // }
    setError('');
    return { isValid: true, error: '' };
  }

  return { error, setError, validateLoginForm };
}
