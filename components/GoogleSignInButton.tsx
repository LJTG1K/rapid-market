import { useEffect, useRef, useState } from 'react';

/**
 * Google's own "Continue with Google" button (Google Identity Services).
 * Renders nothing until NEXT_PUBLIC_GOOGLE_CLIENT_ID is set, so the site works
 * unchanged before the Google Cloud client exists. Hands the ID token
 * (`credential`) to onCredential; the server verifies it (/api/auth/google).
 */

declare global {
  interface Window {
    google?: any;
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error('Google sign-in failed to load'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export const googleSignInEnabled = Boolean(CLIENT_ID);

export default function GoogleSignInButton({
  onCredential,
  text = 'continue_with',
}: {
  onCredential: (credential: string) => void;
  text?: 'continue_with' | 'signin_with' | 'signup_with';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handler = useRef(onCredential);
  handler.current = onCredential;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp: { credential?: string }) => resp.credential && handler.current(resp.credential),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          logo_alignment: 'center',
          width: Math.min(ref.current.offsetWidth || 400, 400),
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!CLIENT_ID) return null;
  if (failed) {
    return <p className="text-sm text-muted text-center">Google sign-in didn&apos;t load. Use your email below.</p>;
  }
  return <div ref={ref} className="w-full flex justify-center min-h-[44px]" />;
}
