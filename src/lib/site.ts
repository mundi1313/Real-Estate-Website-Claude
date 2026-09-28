// Central site config. Every page pulls agent/brokerage identity from here
// so the RECA-required name + "eXp Realty" can never be omitted from a template.
export const site = {
  // Placeholder until the final domain is chosen (must be generic, no REALTOR/MLS,
  // no Associates/Brokerage/Company/Corp/Inc/Ltd).
  brand: "Edmonton Urban Living",
  agent: {
    name: "Arman Mundi",
    title: "REALTOR®",
    team: "Müve Team",
    brokerage: "eXp Realty",
    city: "Edmonton, Alberta",
  },
  board: "REALTORS® Association of Edmonton",
  // Compliance caps (RAE checklist §4)
  maxListingsTotal: 1500,
  pageSize: 100,
  maxDataAgeHours: 24,
  passwordMaxAgeDays: 90,
} as const;
