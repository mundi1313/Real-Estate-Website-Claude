import { site } from "@/lib/site";

// DRAFT WORDING — must be reviewed by eXp Realty compliance / counsel before launch (CASL applies).
// The exact text a user saw is stored with their record as proof of consent.
export const TERMS_TEXT = "I agree to the Terms of Use and Privacy Policy.";

export const MARKETING_TEXT =
  `I agree to be contacted by ${site.agent.name} of ${site.agent.brokerage} by phone, text message and email about ` +
  "real estate, including marketing. This is optional and not a condition of using this site or buying anything. " +
  "Message and data rates may apply. You can withdraw consent at any time (reply STOP to a text, or use the unsubscribe link in an email).";
