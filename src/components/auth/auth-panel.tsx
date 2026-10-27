'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Shield,
  ShoppingCart,
  Sparkles,
  Sprout,
  Truck,
  Warehouse,
} from 'lucide-react';
import { getAuthRedirectUrl } from '@/lib/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { KavandorLogo } from '@/components/ui/logo';

export type AccountRole = 'farmer' | 'buyer' | 'facility_operator' | 'transport_provider';

interface RoleConfig {
  id: AccountRole;
  shortLabel: string;
  fullTitle: string;
  tagline: string;
  destination: string;
  icon: typeof Sprout;
}

export const ROLES: Record<AccountRole, RoleConfig> = {
  farmer: {
    id: 'farmer',
    shortLabel: 'Farmer',
    fullTitle: 'Smallholder Farmer',
    tagline: 'AI vision grading, preservation arbitrage ROI & direct cold bay booking.',
    destination: '/dashboard',
    icon: Sprout,
  },
  buyer: {
    id: 'buyer',
    shortLabel: 'Wholesale Buyer',
    fullTitle: 'Produce Buyer & Aggregator',
    tagline: 'Browse verified produce lots, place bids & execute escrow milestone contracts.',
    destination: '/marketplace',
    icon: ShoppingCart,
  },
  facility_operator: {
    id: 'facility_operator',
    shortLabel: 'Cold Storage',
    fullTitle: 'Cold Storage Hub Operator',
    tagline: 'Live bay IoT telemetry, 6-digit intake passcodes & atomic capacity ledger.',
    destination: '/partners',
    icon: Warehouse,
  },
  transport_provider: {
    id: 'transport_provider',
    shortLabel: 'Logistics',
    fullTitle: 'Songa Mobility Fleet',
    tagline: 'First-mile farmgate collection, route dispatch & digital chain-of-custody.',
    destination: '/transport',
    icon: Truck,
  },
};

function GoogleIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function persistClientRole(role: AccountRole) {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `kavandor_auth_role=${role}; path=/; max-age=3600; SameSite=Lax`;
    document.cookie = `kavandor_active_role=${role}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    localStorage.setItem('kavandor_auth_role', role);
    localStorage.setItem('kavandor_active_role', role);
  } catch {
    // non-blocking
  }
}

export function AuthPanel() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<AccountRole>('farmer');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRoleConfig = ROLES[selectedRole];

  // 1. Google OAuth with target role persistence
  async function handleGoogleSignIn() {
    setIsSubmitting(true);
    setStatus(`Connecting with Google as ${activeRoleConfig.shortLabel}...`);

    persistClientRole(selectedRole);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // Graceful fallback for pitch demo if network or credentials aren't reached
      setStatus(`Directing to ${activeRoleConfig.fullTitle} workspace...`);
      router.push(activeRoleConfig.destination);
      return;
    }

    try {
      const redirectTo = `${getAuthRedirectUrl()}/auth/callback?role=${selectedRole}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setStatus(error.message);
        setIsSubmitting(false);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Launching authentication...');
      router.push(activeRoleConfig.destination);
    }
  }

  // 2. Instant Pitch Mode: 1-Click access to role workspace for live hackathon presentations
  function handlePitchDemoAccess() {
    setIsSubmitting(true);
    setStatus(`Accessing ${activeRoleConfig.fullTitle} workspace...`);
    persistClientRole(selectedRole);
    router.push(activeRoleConfig.destination);
  }

  // 3. Email & Password authentication
  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('');
    persistClientRole(selectedRole);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      router.push(activeRoleConfig.destination);
      return;
    }

    try {
      const action = mode === 'signin' ? supabase.auth.signInWithPassword : supabase.auth.signUp;
      const result = await action({
        email,
        password,
        ...(mode === 'signup'
          ? {
              options: {
                emailRedirectTo: `${getAuthRedirectUrl()}/auth/callback?role=${selectedRole}`,
                data: {
                  account_role: selectedRole,
                  role: selectedRole,
                },
              },
            }
          : {}),
      });

      if (result.error) {
        setStatus(result.error.message);
        setIsSubmitting(false);
        return;
      }

      if (mode === 'signup') {
        setStatus(`Account created for ${activeRoleConfig.shortLabel}. Check email to confirm!`);
        setIsSubmitting(false);
      } else {
        router.push(activeRoleConfig.destination);
      }
    } catch {
      router.push(activeRoleConfig.destination);
    }
  }

  return (
    <div className="w-full max-w-[460px] rounded-3xl border border-[#E2DED6] bg-white p-6 shadow-[0_24px_50px_-12px_rgba(23,25,29,0.08)] sm:p-8">
      {/* Brand & Heading */}
      <div className="flex flex-col items-center text-center">
        <KavandorLogo textColor="text-[#17191D]" iconSize={32} />
        <h1 className="mt-4 text-2xl font-black tracking-tight text-[#17191D] sm:text-3xl">
          {mode === 'signin' ? 'Sign in to KAVANDOR' : 'Create KAVANDOR account'}
        </h1>
        <p className="mt-1.5 text-xs text-[#74767B]">
          Intelligent Harvest &amp; Supply Network · Kisii &amp; Nyamira
        </p>
      </div>

      {/* Role Selector Tabs (Minimalist 4-Pill Segmented Control) */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#74767B]">
            Select Persona
          </span>
          <span className="text-[11px] font-mono font-semibold text-[#FF5A1F]">
            {activeRoleConfig.destination}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(ROLES) as AccountRole[]).map((rKey) => {
            const role = ROLES[rKey];
            const Icon = role.icon;
            const active = selectedRole === rKey;
            return (
              <button
                key={rKey}
                type="button"
                onClick={() => {
                  setSelectedRole(rKey);
                  setStatus('');
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-2.5 text-center transition-all ${
                  active
                    ? 'border-[#FF5A1F] bg-[#FFF8F5] text-[#FF5A1F] ring-2 ring-[#FF5A1F]/20 font-bold shadow-xs'
                    : 'border-[#E2DED6] bg-white text-[#74767B] hover:border-[#17191D]/30 hover:bg-[#FAF9F5]'
                }`}
              >
                <Icon size={18} className={active ? 'text-[#FF5A1F]' : 'text-[#74767B]'} />
                <span className="text-xs leading-none">{role.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Minimal 1-Line Role Capability Context */}
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#FAF9F5] p-3 text-left border border-[#E2DED6]/70">
          <Sparkles size={14} className="text-[#FF5A1F] shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#17191D]">{activeRoleConfig.fullTitle}</p>
            <p className="text-[11px] leading-relaxed text-[#74767B]">{activeRoleConfig.tagline}</p>
          </div>
        </div>
      </div>

      {/* Primary Google Sign-In */}
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="group flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#17191D] bg-white px-4 py-3.5 text-sm font-bold text-[#17191D] shadow-xs transition-all hover:bg-[#FAF9F5] hover:shadow-md active:scale-[0.99] disabled:opacity-50"
        >
          <GoogleIcon className="size-5 transition-transform group-hover:scale-110" />
          <span>Continue with Google as {activeRoleConfig.shortLabel}</span>
        </button>

        {/* 1-Click Pitch Mode Access Button */}
        <button
          type="button"
          onClick={handlePitchDemoAccess}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17191D] px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-black active:scale-[0.99] disabled:opacity-50"
        >
          <Shield size={14} className="text-[#FF5A1F]" />
          <span>Pitch Mode: Instant {activeRoleConfig.shortLabel} Access</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Subtle Email Collapsible Form */}
      <div className="mt-5 border-t border-[#E2DED6] pt-4">
        {!showEmailForm ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#74767B]">Prefer email &amp; password?</span>
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="font-bold text-[#FF5A1F] hover:underline"
            >
              Sign in with email
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#74767B]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`font-bold transition ${mode === 'signin' ? 'text-[#17191D] underline' : 'text-[#74767B]'}`}
                >
                  Sign in
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`font-bold transition ${mode === 'signup' ? 'text-[#17191D] underline' : 'text-[#74767B]'}`}
                >
                  Create account
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="text-[11px] text-[#74767B] hover:text-[#17191D]"
              >
                Hide
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#E2DED6] bg-[#FAF9F5] px-3 py-2.5 text-xs text-[#17191D] focus-within:border-[#FF5A1F] focus-within:bg-white transition">
              <Mail size={15} className="text-[#74767B]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                required
                className="w-full bg-transparent outline-none placeholder:text-[#74767B]/60"
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#E2DED6] bg-[#FAF9F5] px-3 py-2.5 text-xs text-[#17191D] focus-within:border-[#FF5A1F] focus-within:bg-white transition">
              <LockKeyhole size={15} className="text-[#74767B]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 8 characters)"
                required
                minLength={8}
                className="w-full bg-transparent outline-none placeholder:text-[#74767B]/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#74767B] hover:text-[#17191D]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#17191D] bg-[#FAF9F5] px-4 py-2.5 text-xs font-bold text-[#17191D] hover:bg-[#17191D] hover:text-white transition disabled:opacity-50"
            >
              {isSubmitting ? (
                'Processing...'
              ) : mode === 'signin' ? (
                <>Sign in with email →</>
              ) : (
                <>Register account →</>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Status feedback */}
      {status && (
        <div className="mt-4 rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-2.5 text-center text-xs font-semibold text-[#17191D] animate-in fade-in duration-200">
          {status}
        </div>
      )}
    </div>
  );
}
