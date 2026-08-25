import { tokenize } from "./keywords";

/** How much weight the job description puts on a skill. */
export type SkillPriority = "high" | "medium" | "low";

/** Mentions at or above this count make a missing skill high priority. */
export const HIGH_PRIORITY_MENTIONS = 3;

/** A missing skill, with how often the job description asks for it. */
export interface RankedSkill {
  /** The skill name, exactly as the analysis reported it. */
  name: string;
  /** Times the skill appears in the job description. */
  mentions: number;
  /** Band derived from the mention count. */
  priority: SkillPriority;
}

/**
 * Count how often a skill appears in the given text. Matching is token-based,
 * so it ignores case and surrounding punctuation ("React," matches "React"),
 * and multi-word skills ("machine learning") match only as a full phrase. Pure.
 */
export function countMentions(skill: string, text: string): number {
  const needle = tokenize(skill);
  if (needle.length === 0) return 0;

  const haystack = tokenize(text);
  let count = 0;
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((token, offset) => haystack[i + offset] === token)) count++;
  }
  return count;
}

/** Band a mention count into a priority. */
export function priorityFor(mentions: number): SkillPriority {
  if (mentions >= HIGH_PRIORITY_MENTIONS) return "high";
  if (mentions > 0) return "medium";
  return "low";
}

/**
 * Rank missing skills by how heavily the job description leans on them, so the
 * biggest gaps come first. Ties are broken alphabetically for stable output;
 * blank names are dropped. Pure — safe to call during render.
 */
export function rankMissingSkills(missingSkills: string[], jobDescription: string): RankedSkill[] {
  return missingSkills
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0)
    .map((name) => {
      const mentions = countMentions(name, jobDescription);
      return { name, mentions, priority: priorityFor(mentions) };
    })
    .sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name));
}
