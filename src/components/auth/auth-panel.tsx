'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sprout,
  Truck,
  Warehouse,
} from 'lucide-react';
import { getAuthRedirectUrl, getSocialAuthProviders, isAuthReady } from '@/lib/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export type AccountRole = 'farmer' | 'buyer' | 'facility_operator' | 'transport_provider';

interface RoleDefinition {
  id: AccountRole;
  label: string;
  badge: string;
  tagline: string;
  destination: string;
  workspaceName: string;
  icon: typeof Sprout;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  features: string[];
}

export const ROLE_DEFINITIONS: Record<AccountRole, RoleDefinition> = {
  farmer: {
    id: 'farmer',
    label: 'Smallholder Farmer',
    badge: 'Producer',
    tagline: 'Register harvests, evaluate cold storage arbitrage ROI, and connect directly to buyers.',
    destination: '/dashboard',
    workspaceName: 'Farmer Operations Hub',
    icon: Sprout,
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
    accentBorder: 'border-emerald-500',
    features: [
      'AI Vision Grading & Quality Appraisal (Grade A/B/C)',
      'Preservation Arbitrage Calculator (Immediate Sale vs Cold Bay ROI)',
      'Direct Micro-Cold Bay Booking across Kisii & Nyamira',
      'Transparent Wholesale Buyer Offers & Digital Escrow Payouts',
    ],
  },
  buyer: {
    id: 'buyer',
    label: 'Wholesale Buyer & Aggregator',
    badge: 'Commercial Buyer',
    tagline: 'Source verified, AI-graded farmgate lots with protected milestone escrow contracts.',
    destination: '/marketplace',
    workspaceName: 'Produce Exchange & Escrow Ledger',
    icon: ShoppingCart,
    accentBg: 'bg-orange-50',
    accentText: 'text-[#FF5A1F]',
    accentBorder: 'border-[#FF5A1F]',
    features: [
      'Regional Farmgate Exchange (Tomatoes, Avocados, Bananas)',
      'Binding Escrow Purchase Agreements & Digital Bidding',
      'Cold Storage Digital Release Passcodes & Chain-of-Custody',
      'Multi-Farm Aggregation & Scheduled First-Mile Pickup',
    ],
  },
  facility_operator: {
    id: 'facility_operator',
    label: 'Cold Storage Operator',
    badge: 'Storage Hub',
    tagline: 'Manage micro-cold room bays, live climate telemetry, and 6-digit intake/release passcodes.',
    destination: '/partners',
    workspaceName: 'Cold Hub Command Center',
    icon: Warehouse,
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-700',
    accentBorder: 'border-blue-600',
    features: [
      'Live IoT Sensor Telemetry (Temperature, Relative Humidity %, Power)',
      'Atomic Capacity Ledger (Available, Reserved, Occupied kg)',
      'Cryptographic 6-Digit Passcode Sign-off for Intake & Release',
      'Automated Spoilage Risk Alerts & Ambient Bay Controls',
    ],
  },
  transport_provider: {
    id: 'transport_provider',
    label: 'Songa Mobility Fleet',
    badge: 'Logistics Partner',
    tagline: 'First-mile farmgate collection, transit tracking, and certified cold-chain handoffs.',
    destination: '/transport',
    workspaceName: 'Fleet Transit & Dispatch Depot',
    icon: Truck,
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-800',
    accentBorder: 'border-amber-600',
    features: [
      'Optimized Rural Routing across Kisii & Nyamira Farm Clusters',
      'IoT Cold-Chain Transit Telemetry & Spoilage Prevention',
      'Digital Verification of Farmgate Pickup & Cold Hub Handoff',
      'Fleet Vehicle Allocation & Driver Dispatch Ledger',
    ],
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

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<AccountRole>('farmer');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const socialProviders = useMemo(() => getSocialAuthProviders(), []);
  const googleConfig = useMemo(() => socialProviders.find((p) => p.id === 'google'), [socialProviders]);
  const ready = isAuthReady();
  const activeDef = ROLE_DEFINITIONS[selectedRole];

  async function handleGoogleSignIn(targetRole: AccountRole = selectedRole) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus('Authentication service is initializing. Please verify Supabase credentials.');
      return;
    }

    setIsSubmitting(true);
    setStatus(`Connecting with Google as ${ROLE_DEFINITIONS[targetRole].label}...`);

    try {
      // 1. Store intended role in cookie for OAuth redirect exchange
      if (typeof document !== 'undefined') {
        document.cookie = `kavandor_auth_role=${targetRole}; path=/; max-age=3600; SameSite=Lax`;
        try {
          localStorage.setItem('kavandor_auth_role', targetRole);
          localStorage.setItem('kavandor_active_role', targetRole);
        } catch {
          // localStorage non-blocking
        }
      }

      // 2. Direct to OAuth endpoint with designated target role
      const redirectTo = `${getAuthRedirectUrl()}/auth/callback?role=${targetRole}`;
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
      setStatus(err instanceof Error ? err.message : 'Failed to launch Google Sign-In.');
      setIsSubmitting(false);
    }
  }

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus('Authentication service is not configured yet.');
      return;
    }

    setIsSubmitting(true);
    setStatus('');

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
        return;
      }

      if (mode === 'signup') {
        setStatus(`Account created for ${activeDef.label}! Check your inbox to confirm your email.`);
      } else {
        setStatus('Signed in successfully. Redirecting to your workspace...');
        const userMetaRole = (result.data.user?.user_metadata?.account_role ||
          result.data.user?.user_metadata?.role ||
          selectedRole) as AccountRole;

        if (typeof document !== 'undefined') {
          document.cookie = `kavandor_active_role=${userMetaRole}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
          try {
            localStorage.setItem('kavandor_active_role', userMetaRole);
          } catch {
            // ignore
          }
        }

        const destination = ROLE_DEFINITIONS[userMetaRole]?.destination || '/dashboard';
        router.push(destination);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to complete authentication.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-3xl border border-[#E2DED6] bg-white p-6 shadow-[0_24px_80px_rgba(23,25,29,0.08)] sm:p-10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
              KAVANDOR Identity Network
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              <ShieldCheck size={12} /> Supabase Verified
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17191D]">
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your KAVANDOR account'}
          </h1>
          <p className="mt-1 text-sm text-[#74767B]">
            Select your operational role below to sign in with Google or email credentials.
          </p>
        </div>

        <div className="flex self-start rounded-full border border-[#E2DED6] bg-[#FAF9F5] px-3 py-1 text-xs font-bold text-[#17191D]">
          {ready ? (
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Auth Ready
            </span>
          ) : (
            <span className="text-amber-700">Credentials Pending</span>
          )}
        </div>
      </div>

      {/* Role Selection Grid */}
      <div className="mt-7">
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#74767B] mb-2.5">
          Step 1: Choose Operational Role
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(ROLE_DEFINITIONS) as AccountRole[]).map((roleKey) => {
            const def = ROLE_DEFINITIONS[roleKey];
            const Icon = def.icon;
            const active = selectedRole === roleKey;

            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => setSelectedRole(roleKey)}
                aria-pressed={active}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? 'border-[#FF5A1F] bg-[#FFF8F5] ring-2 ring-[#FF5A1F]/20 shadow-sm'
                    : 'border-[#E2DED6] bg-white hover:border-[#17191D]/30 hover:bg-[#FAF9F5]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`grid size-9 place-items-center rounded-xl ${
                        active ? 'bg-[#FF5A1F] text-white' : 'bg-neutral-100 text-[#17191D]'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        active ? 'bg-[#FF5A1F]/15 text-[#FF5A1F]' : 'bg-neutral-100 text-[#74767B]'
                      }`}
                    >
                      {def.badge}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-[#17191D]">{def.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#74767B]">{def.tagline}</p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-[11px] font-mono">
                  <span className="text-[#74767B]">Target:</span>
                  <span className={`font-semibold ${active ? 'text-[#FF5A1F]' : 'text-[#17191D]'}`}>
                    {def.destination}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Feature Distinction Card */}
      <div className={`mt-5 rounded-2xl border p-4 transition-all ${activeDef.accentBg} ${activeDef.accentBorder} border-opacity-40`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className={activeDef.accentText} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17191D]">
              {activeDef.label} — Feature Capabilities &amp; Access
            </h4>
          </div>
          <span className="text-xs font-mono font-semibold text-[#74767B]">
            {activeDef.workspaceName}
          </span>
        </div>

        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {activeDef.features.map((feat, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-[#212329]">
              <CheckCircle2 size={15} className={`shrink-0 mt-0.5 ${activeDef.accentText}`} />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mode Toggle (Sign In / Create Account) */}
      <div className="mt-6 flex rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-1">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
            mode === 'signin' ? 'bg-white text-[#17191D] shadow-xs' : 'text-[#74767B] hover:text-[#17191D]'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
            mode === 'signup' ? 'bg-white text-[#17191D] shadow-xs' : 'text-[#74767B] hover:text-[#17191D]'
          }`}
        >
          Create account
        </button>
      </div>

      {/* Step 2: Google Sign-In with Role Binding */}
      <div className="mt-6 space-y-3">
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#74767B]">
          Step 2: Sign In with Google
        </label>

        {googleConfig && (
          <button
            type="button"
            onClick={() => handleGoogleSignIn(selectedRole)}
            disabled={!ready || isSubmitting}
            className="group flex w-full items-center justify-between rounded-2xl border-2 border-[#17191D] bg-white px-5 py-4 text-left transition-all hover:bg-[#FAF9F5] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="grid size-10 place-items-center rounded-xl border border-[#E2DED6] bg-white shadow-2xs group-hover:scale-105 transition-transform">
                <GoogleIcon className="size-5" />
              </div>
              <div>
                <span className="block text-sm font-extrabold text-[#17191D]">
                  Continue with Google as {activeDef.label}
                </span>
                <span className="block text-xs text-[#74767B]">
                  Direct access to {activeDef.workspaceName} ({activeDef.destination})
                </span>
              </div>
            </div>
            <ArrowRight size={18} className="text-[#17191D] group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        {/* Quick 1-Click Role Sign-Ins */}
        <div className="rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-3">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#74767B] mb-2 font-semibold">
            Quick 1-Click Google Access by Role:
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(ROLE_DEFINITIONS) as AccountRole[]).map((rKey) => {
              const def = ROLE_DEFINITIONS[rKey];
              const Icon = def.icon;
              return (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => {
                    setSelectedRole(rKey);
                    void handleGoogleSignIn(rKey);
                  }}
                  disabled={!ready || isSubmitting}
                  className="flex items-center gap-1.5 rounded-lg border border-[#E2DED6] bg-white px-2.5 py-2 text-[11px] font-bold text-[#17191D] hover:border-[#FF5A1F] hover:bg-[#FFF8F5] transition disabled:opacity-50"
                >
                  <Icon size={13} className="text-[#FF5A1F]" />
                  <span className="truncate">{def.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alternative Email Authentication */}
      <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[#74767B]">
        <span className="h-px flex-1 bg-[#E2DED6]" />
        or continue with email credentials
        <span className="h-px flex-1 bg-[#E2DED6]" />
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#17191D]">Email Address</span>
          <div className="flex items-center gap-2 rounded-xl border border-[#E2DED6] bg-[#FAF9F5] px-3.5 py-3 text-[#17191D] focus-within:border-[#FF5A1F] focus-within:bg-white transition">
            <Mail size={16} className="text-[#74767B]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#74767B]/60"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#17191D]">Password</span>
          <div className="flex items-center gap-2 rounded-xl border border-[#E2DED6] bg-[#FAF9F5] px-3.5 py-3 text-[#17191D] focus-within:border-[#FF5A1F] focus-within:bg-white transition">
            <LockKeyhole size={16} className="text-[#74767B]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#74767B]/60"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !ready}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17191D] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-black active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
        >
          {isSubmitting ? (
            'Processing request...'
          ) : mode === 'signin' ? (
            <>
              Sign in as {activeDef.label} <ArrowRight size={16} />
            </>
          ) : (
            <>
              Register as {activeDef.label} <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Status Notice */}
      {status && (
        <div className="mt-4 rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-3 text-xs font-medium text-[#17191D]">
          {status}
        </div>
      )}
    </div>
  );
}
