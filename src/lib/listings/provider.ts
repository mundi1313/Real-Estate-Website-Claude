import { mockProvider } from "./mock";
import type { ListingProvider } from "./types";

// Swap to the Bridge (RESO Web API) provider once RAE approves the IDX license
// and the test feed is granted. Fail closed in production so sample data
// can never be presented as real MLS® data.
export function getProvider(): ListingProvider {
  if (process.env.LISTINGS_SOURCE === "bridge") {
    throw new Error("Bridge provider not implemented yet — awaiting RAE approval / Bridge invite.");
  }
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SAMPLE_DATA !== "true") {
    throw new Error("Refusing to serve sample listings in production.");
  }
  return mockProvider;
}

export const isSampleData = () => process.env.LISTINGS_SOURCE !== "bridge";
