/**
 * Remembers, per browser, whether the shopper last signed in to RAPID with
 * Google or with email + password, so copy like the Sugargoo handoff can say
 * the right thing ("same email and password" is only true for password users).
 * A convenience only: if storage is blocked it falls back to the password copy.
 */
export type SignInMethod = 'google' | 'password';

const KEY = 'rapid_signin_method';

export function rememberSignInMethod(method: SignInMethod): void {
  try {
    window.localStorage.setItem(KEY, method);
  } catch {
    // storage blocked: copy falls back to the password wording
  }
}

export function lastSignInMethod(): SignInMethod | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'google' || v === 'password' ? v : null;
  } catch {
    return null;
  }
}
