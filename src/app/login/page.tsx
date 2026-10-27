import { AuthPanel } from '@/components/auth/auth-panel';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#F0F9F2_0%,_#EAF6EE_30%,_#F9FBF8_100%)] px-4 py-12">
      <AuthPanel />
    </main>
  );
}
