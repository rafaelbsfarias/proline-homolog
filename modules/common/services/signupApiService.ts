import { SignupFormState } from '@/modules/common/hooks/Signup/useSignupForm';

/**
 * Client-side service to handle the API call for user signup.
 * @param formData The user registration data.
 * @returns The JSON response from the API.
 * @throws An error if the network request fails or the API returns an error.
 */
export async function callSignupApi(formData: Omit<SignupFormState, 'confirmPassword'>) {
  const response = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erro ao realizar cadastro.');
  }

  return data;
}
