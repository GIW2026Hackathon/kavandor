import {
  env,
  hasFacebookAuthConfig,
  hasGoogleAuthConfig,
  hasSupabaseConfig,
} from '@/lib/env';

export type SocialProvider = 'google' | 'facebook';

export interface SocialAuthProviderConfig {
  id: SocialProvider;
  label: string;
  description: string;
  enabled: boolean;
  envVar: string;
}

export function getSocialAuthProviders(): SocialAuthProviderConfig[] {
  return [
    {
      id: 'google',
      label: 'Google',
      description: 'Continue with a Google account.',
      enabled: hasGoogleAuthConfig,
      envVar: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      description: 'Continue with a Facebook account.',
      enabled: hasFacebookAuthConfig,
      envVar: 'NEXT_PUBLIC_FACEBOOK_APP_ID',
    },
  ];
}

export function getAuthRedirectUrl() {
  return env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export function isAuthReady() {
  return hasSupabaseConfig;
}
