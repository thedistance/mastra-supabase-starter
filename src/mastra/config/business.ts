/**
 * Business profile used to fill the Aneka call-handling prompt.
 * Override any field via ANEKA_* environment variables (see .env.example).
 */

export type BusinessProfile = {
  BUSINESS_NAME: string;
  OWNER_NAME: string;
  TRADE_OR_BUSINESS_TYPE: string;
  BUSINESS_DESCRIPTION: string;
  KEY_SELLING_POINTS: string;
  QUALIFICATIONS_AND_CREDENTIALS: string;
  SERVICE_AREAS: string;
  EXCLUDED_AREAS: string;
  SERVICE_AREA_APPROVED_ANSWER: string;
  SERVICES_OFFERED: string;
  SERVICES_NOT_OFFERED: string;
  PRICING_PERMISSION_LEVEL: string;
  PRICING_RULES: string;
  PRICING_APPROVED_ANSWER: string;
  QUOTE_APPROVED_ANSWER: string;
  WORKING_DAYS_AND_HOURS: string;
  TYPICAL_AVAILABILITY: string;
  URGENT_AVAILABILITY_RULES: string;
  CALENDAR_OR_BOOKING_SYSTEM: string;
  AVAILABILITY_APPROVED_ANSWER: string;
  OPENING_HOURS_APPROVED_ANSWER: string;
  CREDENTIALS_APPROVED_ANSWER: string;
  PAYMENT_APPROVED_ANSWER: string;
  URGENT_OR_SAFETY_CRITICAL_SCENARIOS: string;
  GOOD_ENQUIRY_CRITERIA: string;
  BAD_ENQUIRY_CRITERIA: string;
  AGENT_TONE: string;
  EXAMPLE_AGENT_TONE: string;
  CUSTOM_AGENT_INTRODUCTION: string;
  AI_DISCLOSURE_RULE: string;
  FORBIDDEN_PHRASES: string;
  REQUIRED_CAUTION_PHRASES: string;
  APPROVED_CLOSING_MESSAGE: string;
  RESPONSE_TIMEFRAME: string;
};

const DEMO_PROFILE: BusinessProfile = {
  BUSINESS_NAME: "Riverside Plumbing",
  OWNER_NAME: "Sam Taylor",
  TRADE_OR_BUSINESS_TYPE: "plumbing and heating business",
  BUSINESS_DESCRIPTION:
    "A local plumbing and heating company serving homes and small businesses with repairs, boiler work, and installations.",
  KEY_SELLING_POINTS:
    "Reliable local plumbers, clear communication, and same-day call-outs when capacity allows.",
  QUALIFICATIONS_AND_CREDENTIALS:
    "Gas Safe registered engineers. Fully insured for domestic work.",
  SERVICE_AREAS: "Leeds city centre, Headingley, Chapel Allerton, Roundhay, and nearby suburbs.",
  EXCLUDED_AREAS: "Areas more than about 45 minutes' drive from Leeds.",
  SERVICE_AREA_APPROVED_ANSWER:
    "We usually cover Leeds and nearby suburbs. If you share your postcode I can pass it to Sam to confirm.",
  SERVICES_OFFERED:
    "Emergency plumbing, boiler repairs and servicing, leak detection, bathroom plumbing, radiator work, and tap or toilet repairs.",
  SERVICES_NOT_OFFERED:
    "Major building work, electrical installation, and commercial industrial plant.",
  PRICING_PERMISSION_LEVEL: "Take details only — do not give firm prices.",
  PRICING_RULES:
    "Do not quote a guaranteed price. Call-out and labour rates are confirmed by the owner after reviewing the job.",
  PRICING_APPROVED_ANSWER:
    "Pricing depends on the job, so I will take the details and ask Sam to confirm the cost with you.",
  QUOTE_APPROVED_ANSWER:
    "I can collect what is needed for a quote and ask Sam to get back to you with an estimate.",
  WORKING_DAYS_AND_HOURS: "Monday to Friday, 8am to 6pm. Saturday mornings by arrangement.",
  TYPICAL_AVAILABILITY: "Weekday appointments are usual; same-day help depends on the diary.",
  URGENT_AVAILABILITY_RULES:
    "For bursts, no heating in cold weather, or serious leaks, take full details immediately and mark the WhatsApp summary URGENT.",
  CALENDAR_OR_BOOKING_SYSTEM: "No live booking calendar is connected. Pass details for a callback.",
  AVAILABILITY_APPROVED_ANSWER:
    "I can take the details and ask Sam to confirm the earliest availability.",
  OPENING_HOURS_APPROVED_ANSWER:
    "The usual hours are Monday to Friday, 8am to 6pm, with Saturday mornings by arrangement.",
  CREDENTIALS_APPROVED_ANSWER:
    "The engineers are Gas Safe registered and the business is fully insured for domestic work.",
  PAYMENT_APPROVED_ANSWER:
    "Payment is usually arranged with Sam after the work. Card and bank transfer are typically accepted.",
  URGENT_OR_SAFETY_CRITICAL_SCENARIOS:
    "Burst pipes, uncontrolled leaks, no heating or hot water in freezing weather, smell of gas, or flooding risk.",
  GOOD_ENQUIRY_CRITERIA:
    "Caller has a clear plumbing or heating need, is in the service area, and can share a name, callback number, and postcode.",
  BAD_ENQUIRY_CRITERIA:
    "Requests clearly outside plumbing and heating, or locations far outside the usual area with no flexibility.",
  AGENT_TONE: "Warm, calm, practical, and concise — like a capable receptionist.",
  EXAMPLE_AGENT_TONE:
    "Thanks for calling. I can take a few details and make sure Sam gets this straight away.",
  CUSTOM_AGENT_INTRODUCTION: "",
  AI_DISCLOSURE_RULE:
    "If asked whether you are a real person or AI, say you are the assistant helping while Sam is unavailable. Do not pretend to be Sam.",
  FORBIDDEN_PHRASES:
    "guaranteed price; we can definitely do that today; leave it with me and it is sorted; I am Sam",
  REQUIRED_CAUTION_PHRASES:
    "I do not want to give you the wrong information; I will pass this to Sam to confirm",
  APPROVED_CLOSING_MESSAGE:
    "Thanks, I have got the details. Sam usually responds within a few hours during working time, and I will make sure they receive this enquiry.",
  RESPONSE_TIMEFRAME: "within a few hours during working time",
};

function envOr(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : fallback;
}

/** Resolve the active business profile (env overrides on top of demo defaults). */
export function getBusinessProfile(): BusinessProfile {
  return {
    BUSINESS_NAME: envOr("ANEKA_BUSINESS_NAME", DEMO_PROFILE.BUSINESS_NAME),
    OWNER_NAME: envOr("ANEKA_OWNER_NAME", DEMO_PROFILE.OWNER_NAME),
    TRADE_OR_BUSINESS_TYPE: envOr(
      "ANEKA_TRADE_OR_BUSINESS_TYPE",
      DEMO_PROFILE.TRADE_OR_BUSINESS_TYPE,
    ),
    BUSINESS_DESCRIPTION: envOr(
      "ANEKA_BUSINESS_DESCRIPTION",
      DEMO_PROFILE.BUSINESS_DESCRIPTION,
    ),
    KEY_SELLING_POINTS: envOr(
      "ANEKA_KEY_SELLING_POINTS",
      DEMO_PROFILE.KEY_SELLING_POINTS,
    ),
    QUALIFICATIONS_AND_CREDENTIALS: envOr(
      "ANEKA_QUALIFICATIONS_AND_CREDENTIALS",
      DEMO_PROFILE.QUALIFICATIONS_AND_CREDENTIALS,
    ),
    SERVICE_AREAS: envOr("ANEKA_SERVICE_AREAS", DEMO_PROFILE.SERVICE_AREAS),
    EXCLUDED_AREAS: envOr("ANEKA_EXCLUDED_AREAS", DEMO_PROFILE.EXCLUDED_AREAS),
    SERVICE_AREA_APPROVED_ANSWER: envOr(
      "ANEKA_SERVICE_AREA_APPROVED_ANSWER",
      DEMO_PROFILE.SERVICE_AREA_APPROVED_ANSWER,
    ),
    SERVICES_OFFERED: envOr("ANEKA_SERVICES_OFFERED", DEMO_PROFILE.SERVICES_OFFERED),
    SERVICES_NOT_OFFERED: envOr(
      "ANEKA_SERVICES_NOT_OFFERED",
      DEMO_PROFILE.SERVICES_NOT_OFFERED,
    ),
    PRICING_PERMISSION_LEVEL: envOr(
      "ANEKA_PRICING_PERMISSION_LEVEL",
      DEMO_PROFILE.PRICING_PERMISSION_LEVEL,
    ),
    PRICING_RULES: envOr("ANEKA_PRICING_RULES", DEMO_PROFILE.PRICING_RULES),
    PRICING_APPROVED_ANSWER: envOr(
      "ANEKA_PRICING_APPROVED_ANSWER",
      DEMO_PROFILE.PRICING_APPROVED_ANSWER,
    ),
    QUOTE_APPROVED_ANSWER: envOr(
      "ANEKA_QUOTE_APPROVED_ANSWER",
      DEMO_PROFILE.QUOTE_APPROVED_ANSWER,
    ),
    WORKING_DAYS_AND_HOURS: envOr(
      "ANEKA_WORKING_DAYS_AND_HOURS",
      DEMO_PROFILE.WORKING_DAYS_AND_HOURS,
    ),
    TYPICAL_AVAILABILITY: envOr(
      "ANEKA_TYPICAL_AVAILABILITY",
      DEMO_PROFILE.TYPICAL_AVAILABILITY,
    ),
    URGENT_AVAILABILITY_RULES: envOr(
      "ANEKA_URGENT_AVAILABILITY_RULES",
      DEMO_PROFILE.URGENT_AVAILABILITY_RULES,
    ),
    CALENDAR_OR_BOOKING_SYSTEM: envOr(
      "ANEKA_CALENDAR_OR_BOOKING_SYSTEM",
      DEMO_PROFILE.CALENDAR_OR_BOOKING_SYSTEM,
    ),
    AVAILABILITY_APPROVED_ANSWER: envOr(
      "ANEKA_AVAILABILITY_APPROVED_ANSWER",
      DEMO_PROFILE.AVAILABILITY_APPROVED_ANSWER,
    ),
    OPENING_HOURS_APPROVED_ANSWER: envOr(
      "ANEKA_OPENING_HOURS_APPROVED_ANSWER",
      DEMO_PROFILE.OPENING_HOURS_APPROVED_ANSWER,
    ),
    CREDENTIALS_APPROVED_ANSWER: envOr(
      "ANEKA_CREDENTIALS_APPROVED_ANSWER",
      DEMO_PROFILE.CREDENTIALS_APPROVED_ANSWER,
    ),
    PAYMENT_APPROVED_ANSWER: envOr(
      "ANEKA_PAYMENT_APPROVED_ANSWER",
      DEMO_PROFILE.PAYMENT_APPROVED_ANSWER,
    ),
    URGENT_OR_SAFETY_CRITICAL_SCENARIOS: envOr(
      "ANEKA_URGENT_OR_SAFETY_CRITICAL_SCENARIOS",
      DEMO_PROFILE.URGENT_OR_SAFETY_CRITICAL_SCENARIOS,
    ),
    GOOD_ENQUIRY_CRITERIA: envOr(
      "ANEKA_GOOD_ENQUIRY_CRITERIA",
      DEMO_PROFILE.GOOD_ENQUIRY_CRITERIA,
    ),
    BAD_ENQUIRY_CRITERIA: envOr(
      "ANEKA_BAD_ENQUIRY_CRITERIA",
      DEMO_PROFILE.BAD_ENQUIRY_CRITERIA,
    ),
    AGENT_TONE: envOr("ANEKA_AGENT_TONE", DEMO_PROFILE.AGENT_TONE),
    EXAMPLE_AGENT_TONE: envOr(
      "ANEKA_EXAMPLE_AGENT_TONE",
      DEMO_PROFILE.EXAMPLE_AGENT_TONE,
    ),
    CUSTOM_AGENT_INTRODUCTION: envOr(
      "ANEKA_CUSTOM_AGENT_INTRODUCTION",
      DEMO_PROFILE.CUSTOM_AGENT_INTRODUCTION,
    ),
    AI_DISCLOSURE_RULE: envOr(
      "ANEKA_AI_DISCLOSURE_RULE",
      DEMO_PROFILE.AI_DISCLOSURE_RULE,
    ),
    FORBIDDEN_PHRASES: envOr("ANEKA_FORBIDDEN_PHRASES", DEMO_PROFILE.FORBIDDEN_PHRASES),
    REQUIRED_CAUTION_PHRASES: envOr(
      "ANEKA_REQUIRED_CAUTION_PHRASES",
      DEMO_PROFILE.REQUIRED_CAUTION_PHRASES,
    ),
    APPROVED_CLOSING_MESSAGE: envOr(
      "ANEKA_APPROVED_CLOSING_MESSAGE",
      DEMO_PROFILE.APPROVED_CLOSING_MESSAGE,
    ),
    RESPONSE_TIMEFRAME: envOr(
      "ANEKA_RESPONSE_TIMEFRAME",
      DEMO_PROFILE.RESPONSE_TIMEFRAME,
    ),
  };
}

/** Owner WhatsApp number in E.164 format (e.g. 447700900123). */
export function getOwnerWhatsAppNumber(): string | undefined {
  const value = process.env.ANEKA_OWNER_WHATSAPP_NUMBER?.trim();
  return value || undefined;
}
