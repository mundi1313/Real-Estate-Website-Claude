"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Renders the timestamp in the viewer's own time zone (RAE requirement).
export default function LocalTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZoneName: "short" }),
    () => "…",
  );
  return <time dateTime={iso}>{text}</time>;
}
