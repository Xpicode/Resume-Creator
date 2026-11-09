import "server-only";
import path from "node:path";
import { Font } from "@react-pdf/renderer";

// Inter (SIL OFL 1.1, see fonts/Inter-OFL-LICENSE.txt). The Latin subset covers ñ, Ñ, é and other Filipino/Spanish letters.
const dir = path.join(process.cwd(), "src", "pdf", "fonts");

let registered = false;

export function registerFonts() {
  if (registered) return;
  Font.register({
    family: "Inter",
    fonts: [
      { src: path.join(dir, "Inter-Regular.woff") },
      { src: path.join(dir, "Inter-Bold.woff"), fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]); // never hyphenate names or words
  registered = true;
}
