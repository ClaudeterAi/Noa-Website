import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { adminConfigured, authOptions, type AdminSession } from "@/server/admin/auth";
import { cormorant, josefin } from "@/fonts";
import "@/styles/globals.css";
import "./admin.css";


export const metadata: Metadata = { title: "NOA Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = adminConfigured() ? ((await getServerSession(authOptions)) as AdminSession | null) : null;
  return (
    <html lang="en" className={`${josefin.variable} ${cormorant.variable}`}>
      <body className="ad">
        {s?.role && (
          <nav className="ad-nav">
            <Link href="/admin" className="logo">NOA</Link>
            <Link href="/admin/bookings">Bookings</Link>
            <Link href="/admin/events">Events</Link>
            <Link href="/admin/media">Media</Link>
            <Link href="/admin/guests">Guests</Link>
            <Link href="/admin/inventory">Inventory</Link>
            <Link href="/admin/notifications">Messages</Link>
            {s.role === "owner" && <Link href="/admin/settings">Settings</Link>}
            <Link href="/admin/audit">Audit</Link>
            <span className="who">{s.user?.email} · {s.role} · <Link href="/api/auth/signout">Sign out</Link></span>
          </nav>
        )}
        {children}
      </body>
    </html>
  );
}
