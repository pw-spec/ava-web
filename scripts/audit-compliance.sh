#!/usr/bin/env bash
# Compliance baseline audit. Fails fast on regressions of the rules in
# docs/COMPLIANCE_BASELINE.md. Run as part of `pnpm verify` before merge.
#
# Updated: 2026-05-08

set -u
cd "$(dirname "$0")/.."

fail=0
pass=0

# -- helpers --------------------------------------------------------------

red()    { printf "\033[31m%s\033[0m" "$1"; }
green()  { printf "\033[32m%s\033[0m" "$1"; }
yellow() { printf "\033[33m%s\033[0m" "$1"; }

ok() {
  printf "  %s %s\n" "$(green '✓')" "$1"
  pass=$((pass+1))
}

bad() {
  printf "  %s %s\n" "$(red '✗')" "$1"
  if [ -n "${2:-}" ]; then
    printf "    %s\n" "$2"
  fi
  fail=$((fail+1))
}

# Assert that a regex pattern is NOT present in the source tree.
# $1 = check name, $2 = regex, $3..N = paths
assert_absent() {
  local name="$1"; shift
  local pattern="$1"; shift
  local hit
  hit=$(grep -rEln "$pattern" "$@" 2>/dev/null | head -3 || true)
  if [ -n "$hit" ]; then
    bad "$name" "found in:\n$hit"
  else
    ok "$name"
  fi
}

# Assert that a regex pattern IS present somewhere in the listed paths.
# $1 = check name, $2 = regex, $3..N = paths
assert_present() {
  local name="$1"; shift
  local pattern="$1"; shift
  if grep -rEq "$pattern" "$@" 2>/dev/null; then
    ok "$name"
  else
    bad "$name" "expected pattern: $pattern"
  fi
}

# -- audit ---------------------------------------------------------------

echo
printf "%s\n" "$(yellow '== Compliance baseline audit ==')"
echo

# 1. Clinical credentials never appear in non-banned-list source.
echo "Brand assets — no clinical credentials:"
assert_absent \
  "no 'Dr.' / 'physician' in user-facing source" \
  "\\bDr\\.|\\bphysician\\b" \
  src/app src/components

assert_absent \
  "no 'as a doctor' / 'as your physician' phrasing in marketing" \
  "as (a|your) (doctor|physician|nurse|RN|NP)" \
  src/app src/components

# 2. Banned imagery references.
assert_absent \
  "no stethoscope / white coat / scrubs imagery refs" \
  "stethoscope|white.?coat|scrubs|exam.?room|prescription.?pad" \
  src/

# 3. PHI boundary.
echo
echo "PHI boundary:"
assert_absent \
  "no localStorage / sessionStorage method calls" \
  "(localStorage|sessionStorage)\\.(setItem|getItem|removeItem|clear|key)" \
  src/

assert_absent \
  "no PHI-bearing URL params" \
  "searchParams.*(state|email|score|intake|symptom|condition)" \
  src/

# 4. AI disclosure surfaces present.
echo
echo "AI disclosure surfaces:"
assert_present \
  "ai-badge in IntakeShell" \
  "ai-badge" \
  src/components/intake/IntakeShell.tsx

assert_present \
  "ai-badge in ChatTopBar" \
  "ai-badge" \
  src/components/chat/ChatTopBar.tsx

assert_present \
  "ai-badge in LandingFooter" \
  "ai-badge" \
  src/components/landing/LandingFooter.tsx

assert_present \
  "ai-badge in ProfileTopBar" \
  "ai-badge" \
  src/components/profile/ProfileTopBar.tsx

assert_present \
  "ai-badge in LabsTopBar" \
  "ai-badge" \
  src/components/labs/LabsTopBar.tsx

assert_present \
  "ai-badge in privacy page" \
  "ai-badge" \
  src/app/privacy/page.tsx

assert_present \
  "ai-badge in terms page" \
  "ai-badge" \
  src/app/terms/page.tsx

# 5. Crisis handler wired.
echo
echo "Crisis handling:"
assert_present \
  "checkEmergency invoked in useChat" \
  "checkEmergency" \
  src/hooks/useChat.ts

assert_present \
  "988 referenced in compliance lib" \
  "\\b988\\b" \
  src/lib/compliance.ts

assert_present \
  "911 referenced in compliance lib" \
  "\\b911\\b" \
  src/lib/compliance.ts

# 6. Geo-block in place — NY + CA must be in BLOCKED_STATES.
echo
echo "Geo-block (state availability):"
assert_present \
  "NY in BLOCKED_STATES" \
  "BLOCKED_STATES.*(\"NY\"|'NY')|new Set\\(.*\"NY\"" \
  src/lib/launchStates.ts

assert_present \
  "CA in BLOCKED_STATES" \
  "BLOCKED_STATES.*(\"CA\"|'CA')|new Set\\(.*\"CA\"" \
  src/lib/launchStates.ts

# 7. Marketing claims — no FTC red-flag positive claims.
echo
echo "Marketing copy (FTC):"
assert_absent \
  "no 'guaranteed prescription' claim" \
  "guaranteed (prescription|results|outcomes?)|guarantee (a|your) prescription" \
  src/app src/components

assert_absent \
  "no 'FDA-approved program' claim" \
  "FDA.?approved (program|treatment)" \
  src/app src/components

assert_absent \
  "no 'doctor-supervised AI' claim" \
  "doctor.?supervised AI|AI.?doctor" \
  src/app src/components

# 8. Required disclosure checkbox at /labs.
echo
echo "Checkout gate:"
if [ -f src/components/labs/DisclosureGate.tsx ]; then
  ok "DisclosureGate component exists"
else
  bad "DisclosureGate component exists"
fi

assert_present \
  "DisclosureGate enforces 'I understand that Ava is an AI'" \
  "I understand that Ava is an AI" \
  src/components/labs/DisclosureGate.tsx

# 9. Age gate ≥ 18 in intake flow.
echo
echo "Age gate:"
assert_present \
  "intakeFlow age min is 18" \
  "min: 18|min:18" \
  src/lib/intakeFlow.ts

# 10. Legacy 6-message gate retired.
echo
echo "Legacy code:"
assert_absent \
  "ANON_MESSAGE_LIMIT removed" \
  "ANON_MESSAGE_LIMIT" \
  src/

# -- summary -------------------------------------------------------------

echo
if [ "$fail" -eq 0 ]; then
  printf "%s %d checks passed.\n" "$(green '✓')" "$pass"
  exit 0
else
  printf "%s %d failed, %d passed.\n" "$(red '✗')" "$fail" "$pass"
  printf "%s\n" "Review docs/COMPLIANCE_BASELINE.md and fix the regression(s) above."
  exit 1
fi
