import { DisclosureForm } from '@/components/auth/DisclosureForm';

export default function DisclosurePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Before you start</h1>
      <DisclosureForm />
    </main>
  );
}
