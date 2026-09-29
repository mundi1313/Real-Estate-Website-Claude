export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  profileComplete: boolean; // phone + terms captured
}

export interface RequestCtx { ip: string | null; userAgent: string | null }

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string; // normalized +1XXXXXXXXXX
  marketingConsent: boolean;
}

export type AuthResult = { ok: true; needsVerification?: boolean; url?: string } | { ok: false; error: string };

export interface AuthBackend {
  mode: "supabase" | "demo";
  signUp(i: SignUpInput, ctx: RequestCtx): Promise<AuthResult>;
  signIn(email: string, password: string, ctx: RequestCtx): Promise<AuthResult>;
  signOut(ctx: RequestCtx): Promise<void>;
  getUser(): Promise<AuthUser | null>;
  completeProfile(i: { phone: string; marketingConsent: boolean }, ctx: RequestCtx): Promise<AuthResult>;
  startGoogle(next: string): Promise<AuthResult>;
  track(type: "listing_view" | "tour_requested", mls: string | null): Promise<void>;
}
