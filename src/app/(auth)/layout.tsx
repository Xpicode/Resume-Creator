import { connection } from "next/server";

// Auth pages use the strict nonce CSP, which needs every request rendered fresh (plan 6.6).
export const instant = false;

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  await connection();
  return children;
}
