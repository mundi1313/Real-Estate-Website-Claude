"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal, { type Step } from "./AuthModal";
import type { AuthUser } from "@/lib/auth/types";

interface Ctx { user: AuthUser | null; isAdmin: boolean; open: (step?: Step) => void }
const AuthCtx = createContext<Ctx>({ user: null, isAdmin: false, open: () => {} });
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ user, mode, isAdmin = false, children }: { user: AuthUser | null; mode: "supabase" | "demo"; isAdmin?: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [step, setStep] = useState<Step | null>(null);
  const [notice, setNotice] = useState("");
  const open = useCallback((s: Step = "start") => setStep(s), []);
  const dismissed = useRef(false);
  const dismiss = useCallback(() => { dismissed.current = true; setStep(null); }, []); // the visitor closed it: stop asking until reload

  // Returning from Google / the email-verification link.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (!p.has("welcome") && !p.has("auth")) return;
    const failed = p.get("auth") === "failed";
    p.delete("welcome"); p.delete("auth");
    const q = p.toString();
    window.history.replaceState(null, "", window.location.pathname + (q ? `?${q}` : ""));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (failed) { setNotice("Sign-in didn't complete. Please try again."); setStep("start"); }
    else if (user && !user.profileComplete) setStep("complete");
  }, [user]);

  // Signed in but profile incomplete (e.g. new email, Google): ask for the missing details.
  useEffect(() => {
    if (user && !user.profileComplete && !dismissed.current) setStep((s) => s ?? "complete");
  }, [user]);

  const value = useMemo(() => ({ user, isAdmin, open }), [user, isAdmin, open]);
  return (
    <AuthCtx.Provider value={value}>
      {children}
      {step && (
        <AuthModal
          step={step} setStep={setStep} onClose={dismiss} mode={mode} notice={notice} user={user}
          onDone={() => { setStep(null); router.refresh(); }}
        />
      )}
    </AuthCtx.Provider>
  );
}
