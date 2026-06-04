import { US_STATES } from '@/lib/auth/states';

// Server component (no client JS): the consent gate must not depend on hydration.
// The native `required` checkbox (and state select, when needed) blocks submission until
// filled; the /disclosure/accept route validates server-side.
export function DisclosureForm({ needsState = false }: { needsState?: boolean }) {
  return (
    <form action="/disclosure/accept" method="post" className="flex max-w-md flex-col gap-4">
      <p className="text-[var(--fg)]/80">
        Ava is an AI companion — not a human and not medical advice. It shares wellness indicators, not
        a medical assessment. In a crisis, call or text 988, or 911.
      </p>

      {needsState && (
        <label className="flex flex-col gap-1 text-sm">
          What state are you in?
          <select
            name="state_code"
            required
            defaultValue=""
            className="rounded-lg border border-[var(--fg)]/15 bg-white/70 px-4 py-3 text-[var(--fg)]"
          >
            <option value="" disabled>
              Select your state
            </option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="accept" value="yes" required />
        I understand Ava is an AI wellness companion and not medical advice.
      </label>
      <button
        type="submit"
        className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white"
      >
        Agree and continue
      </button>
    </form>
  );
}
