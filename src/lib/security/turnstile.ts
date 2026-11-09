import "server-only";
import { serverEnv } from "@/lib/env";

/** Verifies a Cloudflare Turnstile token on the server. Any failure (network, timeout, bad token) = false. */
export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  const body = new URLSearchParams({ secret: serverEnv().TURNSTILE_SECRET_KEY, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: unknown };
    return data.success === true;
  } catch {
    return false;
  }
}
