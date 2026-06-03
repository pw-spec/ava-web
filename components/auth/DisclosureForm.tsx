// Server component (no client JS): the consent gate must not depend on hydration.
// The native `required` checkbox blocks submission until checked; the /disclosure/accept
// route validates server-side. JS polish can be layered on later without weakening the gate.
export function DisclosureForm() {
  return (
    <form action="/disclosure/accept" method="post" className="flex max-w-md flex-col gap-4">
      <p className="text-[var(--fg)]/80">
        Ava is an AI companion — not a human and not medical advice. It shares wellness indicators, not
        a medical assessment. In a crisis, call or text 988, or 911.
      </p>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="accept" value="yes" required />
        I understand Ava is an AI wellness companion and not medical advice.
      </label>
      <button
        type="submit"
        className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white"
      >
        Agree and continue
      </button>
    </form>
  );
}
