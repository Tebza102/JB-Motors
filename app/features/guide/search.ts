import { HOW_TO_TOPICS } from "./content.ts";
import type { GuideAudience, HowToTopic } from "./content.ts";

// Words that carry no meaning in a "how do I..." question.
const STOP_WORDS = new Set(["a","an","the","to","do","i","how","can","my","for","of","on","in","and","or","is","it","what","where","please","want","need","with","me","you","we"]);

export const tokenize = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 1 && !STOP_WORDS.has(word));
/** Treats simple plurals and verb forms as the same word ("invoices" ≈ "invoice", "booking" ≈ "book"). */
const stem = (word: string) => word.replace(/ings?$/, "").replace(/(?<!s)s$/, "") || word;

/**
 * Plain keyword search over the help library: no AI, so answers are always the approved steps.
 * An exact keyword phrase scores highest, then title words, then keyword words, then step text.
 */
export function searchHowTo(query: string, audience: GuideAudience, topics: HowToTopic[] = HOW_TO_TOPICS, limit = 5): HowToTopic[] {
  const normalised = query.trim().toLowerCase();
  const words = tokenize(normalised).map(stem);
  if (!words.length) return [];
  return topics
    .filter((topic) => topic.audience === audience)
    .map((topic) => {
      const title = tokenize(topic.title).map(stem);
      const keywords = topic.keywords.flatMap(tokenize).map(stem);
      const body = topic.steps.flatMap(tokenize).map(stem);
      let score = topic.keywords.some((keyword) => normalised.includes(keyword)) ? 6 : 0;
      for (const word of words) {
        if (title.includes(word)) score += 3;
        else if (keywords.includes(word)) score += 2;
        else if (body.includes(word)) score += 0.5;
      }
      return { topic, score };
    })
    .filter((entry) => entry.score >= 2)
    .sort((a, b) => b.score - a.score || (a.topic.status === "available" ? -1 : 1))
    .slice(0, limit)
    .map((entry) => entry.topic);
}

export const topicsForPage = (page: string, audience: GuideAudience, topics: HowToTopic[] = HOW_TO_TOPICS) => topics.filter((topic) => topic.audience === audience && topic.page === page);
