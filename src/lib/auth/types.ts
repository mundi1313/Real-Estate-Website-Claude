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

// needsPassword: this email is an admin email and must use the admin password. needsSignup: no account yet for this email.
export type AuthResult = { ok: true; url?: string } | { ok: false; error: string; needsPassword?: boolean; needsSignup?: boolean };

export interface AuthBackend {
  mode: "supabase" | "demo";
  signUp(i: SignUpInput, ctx: RequestCtx): Promise<AuthResult>;
  /** Signs an existing visitor in with just their email (no email is sent). */
  signIn(email: string, ctx: RequestCtx): Promise<AuthResult>;
  /** Admin only — the caller must already have verified the admin password. Creates the account if needed. */
  signInAsAdmin(email: string, ctx: RequestCtx): Promise<AuthResult>;
  countAdminFailures(ip: string | null, windowMs: number): Promise<number>;
  recordAdminFailure(ctx: RequestCtx): Promise<void>;
  signOut(ctx: RequestCtx): Promise<void>;
  getUser(): Promise<AuthUser | null>;
  /** True if this email already has an account (used so returning visitors only type their email). */
  emailExists(email: string): Promise<boolean>;
  completeProfile(i: { phone: string; marketingConsent: boolean; firstName?: string; lastName?: string }, ctx: RequestCtx): Promise<AuthResult>;
  startGoogle(next: string): Promise<AuthResult>;
  createTour(i: TourInput, ctx: RequestCtx): Promise<AuthResult>;
  track(type: "listing_view" | "tour_requested", mls: string | null): Promise<void>;
}
