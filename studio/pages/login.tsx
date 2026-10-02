import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Button, Input, Spinner } from '../components/ui';
import { api } from '../lib/client';

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api('/api/login', { method: 'POST', body: { password } });
      router.replace('/brands');
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-50">
      <Head>
        <title>Sign in · RAPID Studio</title>
      </Head>
      <form onSubmit={submit} className="w-[360px] rounded-xl border border-zinc-200 bg-white p-7 shadow-sm">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-900 text-sm font-black text-white">R</span>
        <h1 className="mt-4 text-lg font-semibold">RAPID Studio</h1>
        <p className="mt-1 text-sm text-zinc-500">Enter the team password to edit site content.</p>
        <div className="relative mt-5">
          <Input
            type={show ? 'text' : 'password'}
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Team password"
            className="pr-14"
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:text-zinc-900">
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
        <Button variant="primary" className="mt-4 w-full" disabled={!password || loading}>
          {loading ? <Spinner /> : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
