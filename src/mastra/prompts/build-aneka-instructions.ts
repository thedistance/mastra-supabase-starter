import type { BusinessProfile } from "../config/business.js";
import { ANEKA_PROMPT_TEMPLATE } from "./aneka-template.js";

/** Replace `{{KEY}}` placeholders in the Aneka prompt with business profile values. */
export function buildAnekaInstructions(profile: BusinessProfile): string {
  return ANEKA_PROMPT_TEMPLATE.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (key in profile) {
      return profile[key as keyof BusinessProfile];
    }
    return match;
  });
}
