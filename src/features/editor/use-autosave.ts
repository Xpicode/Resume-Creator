"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveResume } from "@/features/resume/actions";
import type { SaveResumeInput } from "@/features/resume/schema";

export type SaveStatus =
  | { kind: "saved"; at: number }
  | { kind: "pending" }
  | { kind: "saving" }
  | { kind: "error"; message: string }
  | { kind: "conflict" }
  | { kind: "offline" };

const DEBOUNCE_MS = 800;

/**
 * Debounced autosave (plan 5.1 "never lose work"). Saves the whole document, one request at a time,
 * and carries the row's updated_at so a second open tab can't silently overwrite (plan 3.2).
 */
export function useAutosave(id: string, doc: SaveResumeInput, initialUpdatedAt: string) {
  const [status, setStatus] = useState<SaveStatus>({ kind: "saved", at: 0 });
  const [version, setVersion] = useState(initialUpdatedAt);
  const versionRef = useRef(initialUpdatedAt);
  const docRef = useRef(doc);
  const inFlight = useRef(false);
  const again = useRef(false);
  const first = useRef(true);
  const blocked = useRef(false); // stop after a conflict until the user reloads
  const saveRef = useRef<() => Promise<void>>(undefined); // lets save() schedule itself

  useEffect(() => {
    docRef.current = doc;
  });

  const save = useCallback(async () => {
    if (blocked.current) return;
    if (inFlight.current) {
      again.current = true;
      return;
    }
    inFlight.current = true;
    setStatus({ kind: "saving" });
    try {
      const res = await saveResume(id, versionRef.current, docRef.current);
      if (res.ok) {
        versionRef.current = res.updatedAt;
        setVersion(res.updatedAt);
        setStatus({ kind: "saved", at: Date.now() });
      } else if (res.reason === "conflict") {
        blocked.current = true;
        setStatus({ kind: "conflict" });
      } else if (res.reason === "auth") {
        setStatus({ kind: "error", message: "Your session ended. Log in again to keep saving." });
      } else if (res.reason === "invalid") {
        setStatus({
          kind: "error",
          message: `Not saved: ${res.message ?? "please check your entries"}`,
        });
      } else {
        setStatus({ kind: "error", message: "This resume no longer exists." });
      }
    } catch {
      // Network failure: retry when back online, or in 5 s if the browser thinks it's online.
      if (navigator.onLine) {
        setStatus({ kind: "error", message: "Couldn't save. Retrying…" });
        setTimeout(() => void saveRef.current?.(), 5000);
      } else {
        setStatus({ kind: "offline" });
      }
    } finally {
      inFlight.current = false;
      if (again.current) {
        again.current = false;
        void saveRef.current?.();
      }
    }
  }, [id]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (blocked.current) return;
    setStatus({ kind: "pending" });
    const t = setTimeout(() => void save(), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [doc, save]);

  // Warn before closing the tab with unsaved changes; retry when the connection comes back.
  useEffect(() => {
    const unsaved =
      status.kind === "pending" || status.kind === "saving" || status.kind === "offline";
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsaved) e.preventDefault();
    };
    const onOnline = () => {
      if (status.kind === "offline") void save();
    };
    const onOffline = () => setStatus({ kind: "offline" });
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [status, save]);

  /** Save now (e.g. before downloading). Resolves when nothing is pending. */
  const flush = useCallback(async () => {
    await save();
  }, [save]);

  return { status, version, flush };
}
