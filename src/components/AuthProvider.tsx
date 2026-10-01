"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthModal, { type Step } from "./AuthModal";
import type { AuthUser } from "@/lib/auth/types";

interface Ctx { user: AuthUser | null; isAdmin: boolean; open: (step?: Step, forced?: boolean) => void }
const AuthCtx = createContext<Ctx>({ user: null, isAdmin: false, open: () => {} });
export const useAuth = () => useContext(AuthCtx);

// "forced" = a required step (the listing gate, finishing a profile): it has no close button and can't be dismissed.
type Modal = { step: Step; forced: boolean } | null;

export default function AuthProvider({ user, mode, isAdmin = false, children }: { user: AuthUser | null; mode: "supabase" | "demo"; isAdmin?: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState("");
  const open = useCallback((step: Step = "start", forced = false) => setModal({ step, forced }), []);
  const dismiss = useCallback(() => setModal(null), []);
  const setStep = useCallback((step: Step) => setModal((m) => (m ? { ...m, step } : m)), []);

  // A required sign-in popup belongs to the listing it was opened on: leaving the listing closes it.
  // (A required "finish your profile" step is kept everywhere.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModal((m) => (m && m.forced && m.step !== "complete" && !pathname.startsWith("/listings") ? null : m));
  }, [pathname]);

  // Returning from Google / an emailed link.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (!p.has("welcome") && !p.has("auth")) return;
    const failed = p.get("auth") === "failed";
    p.delete("welcome"); p.delete("auth");
    const q = p.toString();
    window.history.replaceState(null, "", window.location.pathname + (q ? `?${q}` : ""));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (failed) { setNotice("Sign-in didn't complete. Please try again."); setModal({ step: "start", forced: false }); }
    else if (user && !user.profileComplete) setModal({ step: "complete", forced: true });
  }, [user]);

  // Signed in but the profile is incomplete (e.g. Google, or a brand-new email): the missing details are required.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user && !user.profileComplete) setModal((m) => m ?? { step: "complete", forced: true });
  }, [user]);

  const value = useMemo(() => ({ user, isAdmin, open }), [user, isAdmin, open]);
  return (
    <AuthCtx.Provider value={value}>
      {children}
      {modal && (
        <AuthModal
          step={modal.step} setStep={setStep} onClose={dismiss} forced={modal.forced} mode={mode} notice={notice} user={user}
          onDone={() => { setModal(null); router.refresh(); }}
        />
      )}
    </AuthCtx.Provider>
  );
}
