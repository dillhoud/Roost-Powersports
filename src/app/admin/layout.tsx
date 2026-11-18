import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Never cache admin pages: they depend on the login cookie and on settings
// (ADMIN_PASSWORD, DATABASE_URL) that may be added after a build.
export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return children;
}
