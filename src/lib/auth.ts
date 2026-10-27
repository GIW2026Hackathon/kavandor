import { hasPublicSupabaseConfig, publicEnv } from '@/lib/public-env';

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
      description: 'Continue with your Google account.',
      enabled: hasPublicSupabaseConfig,
      envVar: 'NEXT_PUBLIC_SUPABASE_URL',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      description: 'Continue with a Facebook account.',
      enabled: Boolean(publicEnv.NEXT_PUBLIC_FACEBOOK_APP_ID),
      envVar: 'NEXT_PUBLIC_FACEBOOK_APP_ID',
    },
  ];
}

export function getAuthRedirectUrl() {
  return publicEnv.NEXT_PUBLIC_SITE_URL;
}

export function isAuthReady() {
  return hasPublicSupabaseConfig;
}
