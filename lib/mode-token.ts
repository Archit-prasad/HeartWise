export type ChatMode = "Wooing them" | "Breaking up" | "Solving complexity";

const VALID_MODES: ChatMode[] = ["Wooing them", "Breaking up", "Solving complexity"];

const TOKEN_START = "[[MODE";
const TOKEN_PATTERN = /^\[\[MODE:\s*(.*?)\s*\]\]/i;

interface ModeExtraction {
  mode: ChatMode | null;
  displayText: string;
}

/**
 * Looks for the model's hidden `[[MODE: <mode_name>]]` tag anywhere in the raw
 * streamed text, strips it (and anything after it) from what the user sees,
 * and reports the detected mode once the tag is fully formed. While the tag
 * is still arriving mid-stream, the partial fragment is hidden too so it
 * never flashes raw text in the chat bubble.
 */
export function extractMode(raw: string): ModeExtraction {
  const idx = raw.lastIndexOf(TOKEN_START);
  if (idx === -1) return { mode: null, displayText: raw };

  const tail = raw.slice(idx);
  const match = tail.match(TOKEN_PATTERN);
  if (match) {
    const candidate = match[1].trim().toLowerCase();
    const mode = VALID_MODES.find((m) => m.toLowerCase() === candidate) ?? null;
    return { mode, displayText: raw.slice(0, idx).trimEnd() };
  }

  return { mode: null, displayText: raw.slice(0, idx).trimEnd() };
}

/**
 * Called once the stream has fully closed. If the tag never resolved
 * (malformed or truncated), reveal the raw text instead of permanently
 * hiding it — no more chunks are coming to complete it.
 */
export function finalizeMode(raw: string): ModeExtraction {
  const result = extractMode(raw);
  if (result.mode) return result;
  return { mode: null, displayText: raw };
}
