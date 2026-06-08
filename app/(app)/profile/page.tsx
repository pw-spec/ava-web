import { createClient } from '@/lib/supabase/server';
import { getWellnessProfile } from '@/lib/credits/store';
import { getLatestHealthScores } from '@/lib/health/store';
import { decryptField } from '@/lib/crypto/field';
import { AXES, tierForOverall, type AxisScores, type RadarProfile } from '@/lib/scoring';
import { ProfileView } from '@/components/profile/ProfileView';

function emptyAxes(): AxisScores {
  const axes = {} as AxisScores;
  for (const a of AXES) axes[a] = null;
  return axes;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <ProfileView state="locked" />; // proxy gates this route; guard anyway

  const entitlement = await getWellnessProfile(supabase, user.id);
  if (!entitlement) return <ProfileView state="locked" />;
  if (entitlement.status !== 'ready' || !entitlement.report) return <ProfileView state="preparing" />;

  const latest = await getLatestHealthScores(supabase, user.id);
  const profile: RadarProfile = latest
    ? { axes: latest.axes, overall: latest.overall, tier: tierForOverall(latest.overall) }
    : { axes: emptyAxes(), overall: null, tier: null };

  return <ProfileView state="ready" report={decryptField(entitlement.report)} profile={profile} />;
}
