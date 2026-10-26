import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FF5A1F]">404 error</span>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17191D]">Page not found</h1>
      <p className="mt-3 text-sm text-[#74767B]">This KAVANDOR route has not been created yet.</p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#FF5A1F] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#E44E18]"
      >
        Return to dashboard
      </Link>
    </main>
  );
}
