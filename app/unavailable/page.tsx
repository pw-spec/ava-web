export default function UnavailablePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Not available in your state yet</h1>
      <p className="text-[var(--fg)]/70">
        Ava isn&apos;t available in your state right now. We&apos;ll let you know when that changes.
      </p>
    </main>
  );
}
