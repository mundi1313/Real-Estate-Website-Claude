import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No ISR/incremental cache needed yet (listings are fetched per request).
export default defineCloudflareConfig();
