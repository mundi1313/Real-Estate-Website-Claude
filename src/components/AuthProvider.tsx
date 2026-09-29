"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal, { type Step } from "./AuthModal";
import type { AuthUser } from "@/lib/auth/types";

interface Ctx { user: AuthUser | null; open: (step?: Step) => void }
const AuthCtx = createContext<Ctx>({ user: null, open: () => {} });
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ user, mode, children }: { user: AuthUser | null; mode: "supabase" | "demo"; children: React.ReactNode }) {
  const router = useRouter();
  const [step, setStep] = useState<Step | null>(null);
  const [notice, setNotice] = useState("");
  const open = useCallback((s: Step = "start") => setStep(s), []);
  const close = useCallback(() => setStep(null), []);

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

  const value = useMemo(() => ({ user, open }), [user, open]);
  return (
    <AuthCtx.Provider value={value}>
      {children}
      {step && (
        <AuthModal
          step={step} setStep={setStep} onClose={close} mode={mode} notice={notice} user={user}
          onDone={() => { close(); router.refresh(); }}
        />
      )}
    </AuthCtx.Provider>
  );
}
