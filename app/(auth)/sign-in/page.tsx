import Link from 'next/link';
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <SignInForm />
      <p className="text-sm text-[var(--fg)]/60">
        New here? <Link href="/sign-up" className="text-[var(--accent)]">Create an account</Link>
      </p>
    </main>
  );
}
