// Central site config. Every page pulls agent/brokerage identity from here
// so the RECA-required name + "eXp Realty" can never be omitted from a template.
export const site = {
  // Domain: keystoedmonton.ca (generic geo-brand: no REALTOR/MLS, none of Associates/Brokerage/Company/Corp/Inc/Ltd).
  brand: "Keys to Edmonton",
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
} as const;
