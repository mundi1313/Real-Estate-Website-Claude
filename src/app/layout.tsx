import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuthProvider from "@/components/AuthProvider";
import { auth } from "@/lib/auth";
import { site } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: `${site.brand} — Edmonton homes for sale`,
  description: `Search Edmonton-area homes for sale. ${site.agent.name}, ${site.agent.brokerage}.`,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await auth.getUser();
  return (
    <html lang="en-CA" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen">
        <AuthProvider user={user} mode={auth.mode}>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
