// Supabase settings, cleaned up so common copy/paste slips can't break sign-in:
// stray quotes/spaces, and a URL that still has a path on the end (e.g. ".../rest/v1/").
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']+|["']+$/g, "").trim();

export const supabaseUrl = () => {
  const raw = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  try { return new URL(raw).origin; } catch { return raw; }
};
export const supabaseAnonKey = () => clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const supabaseServiceKey = () => clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
