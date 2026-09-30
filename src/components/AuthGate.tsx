"use client";
import { useEffect } from "react";
import { trackAction } from "@/app/auth/actions";
import { FREE_LISTING_VIEWS } from "@/lib/auth/rules";
import { useAuth } from "./AuthProvider";

// Anyone can browse; after FREE_LISTING_VIEWS different listings we ask for a free account.
// Signed-in visitors: each view is recorded against their lead record instead.
// NOTE: this is a lead-capture prompt, not a security control (anti-scraping lives at the WAF).
const lastSent = new Map<string, number>();

export default function AuthGate({ mls }: { mls: string }) {
  const { user, open } = useAuth();
  const signedIn = !!user;
  const needsProfile = signedIn && !user!.profileComplete;
  useEffect(() => {
    if (signedIn) {
      if (needsProfile) open("complete");
      else {
        // Every visit counts. The 3-second guard only absorbs accidental double-fires (React dev mode, double-tap),
        // so opening a home again later — even minutes later in the same session — is a new recorded visit.
        const now = Date.now();
        if (now - (lastSent.get(mls) ?? 0) > 3000) { lastSent.set(mls, now); void trackAction("listing_view", mls); }
      }
      return;
    }
    try {
      const seen: string[] = JSON.parse(localStorage.getItem("viewedListings") ?? "[]");
      if (!seen.includes(mls)) seen.push(mls);
      localStorage.setItem("viewedListings", JSON.stringify(seen.slice(-50)));
      if (seen.length > FREE_LISTING_VIEWS) open("start");
    } catch { /* storage blocked: skip the prompt rather than break the page */ }
  }, [mls, signedIn, needsProfile, open]);
  return null;
}
