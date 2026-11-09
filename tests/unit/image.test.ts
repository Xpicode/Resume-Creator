import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { processProfilePhoto, sniffImageType } from "@/lib/security/image";

describe("photo upload checks", () => {
  it("detects real image types by magic bytes", async () => {
    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#f00" } })
      .png()
      .toBuffer();
    const webp = await sharp(png).webp().toBuffer();
    const jpeg = await sharp(png).jpeg().toBuffer();
    expect(sniffImageType(png)).toBe("png");
    expect(sniffImageType(webp)).toBe("webp");
    expect(sniffImageType(jpeg)).toBe("jpeg");
  });

  it("rejects scripts and other files renamed to .jpg", () => {
    expect(sniffImageType(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("%PDF-1.7"))).toBeNull();
    expect(sniffImageType(new Uint8Array([]))).toBeNull();
  });

  it("re-encodes to a 600x600 JPEG and strips EXIF/GPS metadata", async () => {
    const withGps = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: "#0a0" },
    })
      .jpeg()
      .withExif({
        IFD0: { Make: "PhoneCo", Model: "X1" },
        IFD3: { GPSLatitudeRef: "N", GPSLatitude: "14/1 35/1 0/1" },
      })
      .toBuffer();
    expect((await sharp(withGps).metadata()).exif).toBeDefined();

    const out = await processProfilePhoto(withGps);
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("jpeg");
    expect([meta.width, meta.height]).toEqual([600, 600]);
    expect(meta.exif).toBeUndefined();
    expect(out.includes(Buffer.from("PhoneCo"))).toBe(false);
  });
});
