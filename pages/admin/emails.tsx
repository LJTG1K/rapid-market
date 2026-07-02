import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function AdminEmails() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const stored = sessionStorage.getItem('admin_auth');
    if (stored === 'true') {
      setAuthenticated(true);
      fetchEmails();
    } else {
      setLoading(false);
    }
  }, []);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setPasswordError('Incorrect password');
        return;
      }

      sessionStorage.setItem('admin_auth', 'true');
      setAuthenticated(true);
      setPassword('');
      fetchEmails();
    } catch (err) {
      setPasswordError('Authentication failed');
    }
  }

  async function fetchEmails() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/emails');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch emails');
        return;
      }

      setEmails(data.emails || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    try {
      setDownloading(true);
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download' }),
      });

      if (!res.ok) {
        throw new Error('Download failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signup-emails-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  async function handleClearAll() {
    if (!confirm(`Are you sure? This will delete ${emails.length} email records after clearing.`)) {
      return;
    }

    try {
      setClearing(true);
      // Download first
      await handleDownload();
      
      // Then clear
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });

      if (!res.ok) {
        throw new Error('Clear failed');
      }

      // Refresh list
      await fetchEmails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear failed');
    } finally {
      setClearing(false);
    }
  }

  if (!authenticated) {
    return (
      <>
        <Head>
          <title>Admin Login | RAPID</title>
        </Head>

        <div style={styles.container}>
          <div style={styles.header}>
            <h1>Admin Access</h1>
          </div>

          <form onSubmit={handlePasswordSubmit} style={styles.passwordForm}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.passwordInput}
              autoFocus
            />
            <button type="submit" style={styles.passwordButton}>
              Unlock
            </button>
          </form>

          {passwordError && (
            <div style={styles.error}>
              <strong>Error:</strong> {passwordError}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Signup Emails | RAPID Admin</title>
      </Head>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1>Website Signup Emails</h1>
          <p style={styles.subtitle}>
            {loading ? 'Loading...' : `${emails.length} unique email address${emails.length !== 1 ? 'es' : ''}`}
          </p>
        </div>

        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={styles.actions}>
          <button
            onClick={handleDownload}
            disabled={loading || emails.length === 0 || downloading}
            style={{
              ...styles.button,
              ...styles.downloadBtn,
              opacity: loading || emails.length === 0 || downloading ? 0.6 : 1,
              cursor: loading || emails.length === 0 || downloading ? 'not-allowed' : 'pointer',
            }}
          >
            {downloading ? 'Downloading...' : `📥 Download CSV (${emails.length})`}
          </button>

          <button
            onClick={handleClearAll}
            disabled={loading || emails.length === 0 || clearing}
            style={{
              ...styles.button,
              ...styles.clearBtn,
              opacity: loading || emails.length === 0 || clearing ? 0.6 : 1,
              cursor: loading || emails.length === 0 || clearing ? 'not-allowed' : 'pointer',
            }}
          >
            {clearing ? 'Clearing...' : '🗑️  Download & Clear All'}
          </button>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading emails...</div>
        ) : emails.length === 0 ? (
          <div style={styles.empty}>No signup emails yet.</div>
        ) : (
          <div style={styles.emailList}>
            {emails.map((email, idx) => (
              <div key={idx} style={styles.emailItem}>
                <span style={styles.index}>{idx + 1}</span>
                <span style={styles.email}>{email}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  passwordForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  passwordInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  passwordButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  header: {
    marginBottom: '40px',
  },
  subtitle: {
    color: '#666',
    marginTop: '8px',
    fontSize: '14px',
  },
  error: {
    backgroundColor: '#fee',
    border: '1px solid #f99',
    color: '#c33',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '40px',
  },
  button: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  downloadBtn: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  clearBtn: {
    backgroundColor: '#f44336',
    color: 'white',
  },
  loading: {
    textAlign: 'center',
    color: '#999',
    padding: '40px',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    padding: '40px',
  },
  emailList: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '8px',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  emailItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
  },
  index: {
    display: 'inline-block',
    width: '40px',
    color: '#999',
    fontWeight: '500',
  },
  email: {
    color: '#333',
    fontFamily: 'monospace',
  },
};
