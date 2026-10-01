import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import AdminPasswordPrompt from "@/components/admin/AdminPasswordPrompt";
import AdminSignIn from "@/components/admin/AdminSignIn";
import { auth } from "@/lib/auth";
import { isAdmin, isAdminSession } from "@/lib/crm/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await auth.getUser();
  if (!user) return <AdminSignIn />;
  if (!isAdmin(user)) notFound(); // signed-in but not Arman: pretend this area doesn't exist
  if (!(await isAdminSession(user))) return <AdminPasswordPrompt />; // right email, password not entered in this browser yet
  return (
    <div className="container-x py-8">
      <AdminNav />
      {children}
    </div>
  );
}
