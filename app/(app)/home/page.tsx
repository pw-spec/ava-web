import { createClient } from '@/lib/supabase/server';
import { getLatestHealthScores } from '@/lib/health/store';
import { AXES, tierForOverall, type AxisScores, type RadarProfile } from '@/lib/scoring';
import { ChatScreen } from '@/components/chat/ChatScreen';

function emptyAxes(): AxisScores {
  const axes = {} as AxisScores;
  for (const a of AXES) axes[a] = null;
  return axes;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already gates this route; guard anyway. Pre-fill the radar from the latest snapshot.
  const latest = user ? await getLatestHealthScores(supabase, user.id) : null;
  const initialProfile: RadarProfile = latest
    ? { axes: latest.axes, overall: latest.overall, tier: tierForOverall(latest.overall) }
    : { axes: emptyAxes(), overall: null, tier: null };

  return <ChatScreen initialProfile={initialProfile} />;
}
