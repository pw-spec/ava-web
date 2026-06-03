import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { gateDecision } from '@/lib/auth/gate';
import { stateFromGeoHeader } from '@/lib/auth/geo';

// Routes the gate guards. The public landing, the auth pages, and the geo page are exempt.
const GATED_PREFIXES = ['/home'];

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: keep getUser() right after client creation (refreshes the session cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isGated = GATED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  if (!isGated) return response;

  const geoState = stateFromGeoHeader(request.headers.get('x-vercel-ip-country-region'));

  let disclosureAccepted = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('ai_disclosure_accepted_at')
      .eq('id', user.id)
      .maybeSingle();
    disclosureAccepted = Boolean(profile?.ai_disclosure_accepted_at);
  }

  const decision = gateDecision({ hasSession: Boolean(user), disclosureAccepted, geoState });
  if (decision !== 'allow') {
    const url = request.nextUrl.clone();
    url.pathname = decision;
    return NextResponse.redirect(url);
  }
  return response;
}
