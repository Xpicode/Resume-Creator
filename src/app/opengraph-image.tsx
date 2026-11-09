import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — resume builder for Filipino job seekers`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Share image for Facebook, Messenger and LinkedIn links (plan Phase 3C task 14).
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#ffffff",
        borderLeft: "24px solid #1e3a8a",
      }}
    >
      <div style={{ fontSize: 36, color: "#1e3a8a", fontWeight: 700 }}>{SITE_NAME}</div>
      <div style={{ fontSize: 72, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>
        Build a resume that fits how Filipinos actually apply.
      </div>
      <div style={{ fontSize: 32, color: "#475569", marginTop: 32 }}>
        Free · PH sections built in · Honest AI help
      </div>
    </div>,
    size,
  );
}
