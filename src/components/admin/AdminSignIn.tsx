"use client";
import { useAuth } from "@/components/AuthProvider";

export default function AdminSignIn() {
  const { open } = useAuth();
  return (
    <div className="container-x py-24 text-center">
      <h1 className="text-3xl font-semibold">Private area</h1>
      <p className="mt-2 text-ink-soft">Sign in to continue.</p>
      <button onClick={() => open("login")} className="btn btn-brand mt-6">Sign in</button>
    </div>
  );
}
