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
  firstName: string;
  lastName: string;
  phone: string; // normalized +1XXXXXXXXXX
  marketingConsent: boolean;
}

export interface TourInput { mls: string; preferredTimes: string; message: string }

export type AuthResult = { ok: true; needsVerification?: boolean; url?: string } | { ok: false; error: string };

export interface AuthBackend {
  mode: "supabase" | "demo";
  signUp(i: SignUpInput, ctx: RequestCtx): Promise<AuthResult>;
  /** Passwordless: emails a sign-in link (demo mode signs in immediately). */
  signIn(email: string, ctx: RequestCtx): Promise<AuthResult>;
  signOut(ctx: RequestCtx): Promise<void>;
  getUser(): Promise<AuthUser | null>;
  completeProfile(i: { phone: string; marketingConsent: boolean; firstName?: string; lastName?: string }, ctx: RequestCtx): Promise<AuthResult>;
  startGoogle(next: string): Promise<AuthResult>;
  createTour(i: TourInput, ctx: RequestCtx): Promise<AuthResult>;
  track(type: "listing_view" | "tour_requested", mls: string | null): Promise<void>;
}
