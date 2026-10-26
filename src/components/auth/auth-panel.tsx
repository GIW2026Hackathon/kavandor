'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Globe, LockKeyhole, Mail, Users } from 'lucide-react';
import { getAuthRedirectUrl, getSocialAuthProviders, isAuthReady } from '@/lib/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const socialProviders = useMemo(() => getSocialAuthProviders(), []);
  const ready = isAuthReady();

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus('Authentication is not configured yet. Add Supabase credentials to enable sign-in.');
      return;
    }

    setIsSubmitting(true);
    setStatus('');

    try {
      const action = mode === 'signin' ? supabase.auth.signInWithPassword : supabase.auth.signUp;
      const result = await action({
        email,
        password,
        ...(mode === 'signup' ? { options: { emailRedirectTo: `${getAuthRedirectUrl()}/auth/callback` } } : {}),
      });

      if (result.error) {
        setStatus(result.error.message);
        return;
      }

      setStatus(mode === 'signin' ? 'Signed in successfully.' : 'Check your inbox to confirm your account.');
      if (mode === 'signin') {
        router.push('/dashboard');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to complete authentication.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProviderSignIn(provider: 'google' | 'facebook') {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus('Authentication is not configured yet. Add Supabase credentials to enable signing in with Google or Facebook.');
      return;
    }

    setIsSubmitting(true);
    setStatus('');

    const redirectTo = `${getAuthRedirectUrl()}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      setStatus(error.message);
      setIsSubmitting(false);
      return;
    }

    setStatus('Redirecting to your provider...');
  }

  return (
    <div className="w-full max-w-xl rounded-3xl border border-[#004A25]/10 bg-white p-6 shadow-[0_24px_80px_rgba(0,74,37,0.06)] sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#76AC3C]">KAVANDOR</p>
          <h1 className="mt-3 text-3xl font-black text-[#004A25]">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        </div>
        <div className="rounded-full border border-[#004A25]/10 bg-[#F2C303]/20 px-3 py-1 text-xs font-bold text-[#004A25]">
          {ready ? 'Auth ready' : 'Credentials pending'}
        </div>
      </div>

      {!ready && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Add your Supabase project URL and anon key, then configure Google and Facebook providers in the Supabase dashboard.
        </div>
      )}

      <div className="mb-6 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`rounded-xl px-4 py-3 text-sm font-bold transition ${mode === 'signin' ? 'bg-[#004A25] text-white' : 'bg-[#F2F8F5] text-[#004A25]'}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`rounded-xl px-4 py-3 text-sm font-bold transition ${mode === 'signup' ? 'bg-[#004A25] text-white' : 'bg-[#F2F8F5] text-[#004A25]'}`}
        >
          Create account
        </button>
      </div>

      <div className="space-y-3">
        {socialProviders.map((provider) => {
          const icon = provider.id === 'google' ? <Globe size={17} /> : <Users size={17} />;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleProviderSignIn(provider.id)}
              disabled={!provider.enabled || !ready || isSubmitting}
              className="flex w-full items-center justify-between rounded-xl border border-[#004A25]/10 bg-white px-4 py-3 text-sm font-bold text-[#004A25] transition hover:border-[#004A25]/25 hover:bg-[#F2F8F5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex items-center gap-3">
                {icon}
                {provider.label}
              </span>
              <ArrowRight size={16} />
            </button>
          );
        })}
      </div>

      <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#3E594B]/70">
        <span className="h-px flex-1 bg-[#004A25]/10" />
        or continue with email
        <span className="h-px flex-1 bg-[#004A25]/10" />
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#004A25]">Email</span>
          <div className="flex items-center gap-2 rounded-xl border border-[#004A25]/10 bg-[#F8FBF9] px-3 py-3 text-[#004A25]">
            <Mail size={16} className="text-[#3E594B]" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#3E594B]/50"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#004A25]">Password</span>
          <div className="flex items-center gap-2 rounded-xl border border-[#004A25]/10 bg-[#F8FBF9] px-3 py-3 text-[#004A25]">
            <LockKeyhole size={16} className="text-[#3E594B]" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              minLength={8}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#3E594B]/50"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !ready}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#004A25] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#00331b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {status && (
        <p className="mt-4 rounded-xl border border-[#004A25]/10 bg-[#F8FBF9] px-3 py-2 text-sm text-[#004A25]">
          {status}
        </p>
      )}
    </div>
  );
}
