import Link from 'next/link';
import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <SignUpForm />
      <p className="text-sm text-[var(--fg)]/60">
        Already have one? <Link href="/sign-in" className="text-[var(--accent)]">Sign in</Link>
      </p>
    </main>
  );
}
