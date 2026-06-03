import { US_STATES } from '@/lib/auth/states';

export function StateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      aria-label="State"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[var(--fg)]/15 bg-white/70 px-4 py-3 text-[var(--fg)]"
    >
      <option value="">Select your state</option>
      {US_STATES.map((s) => (
        <option key={s.code} value={s.code}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
