const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(write|debug|fix|refactor)\s+(a |this |my )?(function|code|script|program|sql query)\b/i,
  /\b(javascript|typescript|python|react|next\.?js|java\b|c\+\+|sql|html|css|api endpoint)\b/i,
  /\bsolve\b.*\b(equation|integral|derivative|for x)\b/i,
  /\bwhat('?s| is| was) the capital of\b/i,
  /\b\d+\s*[+\-*/]\s*\d+\s*(=|is|equals)?\b/i,
  /\bwho (won|wins|win) the\b/i,
  /\b(recipe|how (do|to) (i |you )?(cook|bake))\b/i,
  /\bweather (today|tomorrow|forecast|this week)\b/i,
  /\btranslate\b.*\b(to|into)\b/i,
  /\b(stock price|cryptocurrency|bitcoin price)\b/i,
];

const RELATIONSHIP_HINTS = [
  "relationship",
  "partner",
  "boyfriend",
  "girlfriend",
  "husband",
  "wife",
  "spouse",
  "dating",
  "marriage",
  "breakup",
  "break up",
  " ex ",
  "my ex",
  "love",
  "feelings",
  "crush",
  "argument",
  "fight",
  "trust",
  "jealous",
  "communicate",
  "affection",
  "intimacy",
  "divorce",
  "reconcile",
];

export function isOffTopic(message: string): boolean {
  const lower = ` ${message.toLowerCase()} `;
  const hasRelationshipHint = RELATIONSHIP_HINTS.some((hint) => lower.includes(hint));
  if (hasRelationshipHint) return false;

  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(message));
}

export const GUARDRAIL_MESSAGE = "Error 404: I am just a relationship counselor";
