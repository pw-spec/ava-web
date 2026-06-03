export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">You&apos;re in.</h1>
      <p className="text-[var(--fg)]/70">
        Your wellness check-in is coming soon. We&apos;ll bring your radar here once it&apos;s ready.
      </p>
      <form action="/auth/signout" method="post">
        <button type="submit" className="rounded-full border border-[var(--fg)]/15 px-5 py-2 text-sm">
          Sign out
        </button>
      </form>
    </main>
  );
}
