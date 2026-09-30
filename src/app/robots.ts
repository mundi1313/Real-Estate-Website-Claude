import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

// While the password gate is on, tell every search engine to stay away. Once public, allow the site but not private areas.
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_PASSWORD || process.env.REQUIRE_SITE_PASSWORD) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/auth", "/unlock"] } };
}
