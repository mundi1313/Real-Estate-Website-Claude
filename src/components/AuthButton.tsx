"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import { useAuth } from "./AuthProvider";

export default function AuthButton() {
  const { user, open } = useAuth();
  const router = useRouter();
  const [pending, start] = useTransition();
  if (!user) return <button onClick={() => open("start")} className="btn border border-line bg-white !py-2 whitespace-nowrap">Sign in</button>;
  return (
    <span className="flex items-center gap-3 text-sm">
      <span className="hidden text-ink-soft sm:inline">Hi, {user.firstName || user.email}</span>
      <button disabled={pending} onClick={() => start(async () => { await signOutAction(); router.refresh(); })} className="btn border border-line bg-white !py-2 whitespace-nowrap">Sign out</button>
    </span>
  );
}
