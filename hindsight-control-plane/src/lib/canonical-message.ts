export const CANONICAL_MESSAGE_TYPE = "hindsight.canonical_message" as const;
export const CANONICAL_MESSAGE_SCHEMA_VERSION = 1 as const;
export const SOURCE_MESSAGE_IDS_METADATA = "hindsight_source_message_ids" as const;
export const SOURCE_MESSAGE_SCHEMA_METADATA = "hindsight_source_schema" as const;

export interface CanonicalTextBlock {
  type: "text" | string;
  text?: string;
}

export interface CanonicalMessageActor {
  role: "user" | "assistant" | "system" | "action" | string;
  [key: string]: unknown;
}

export interface CanonicalMessage {
  type: typeof CANONICAL_MESSAGE_TYPE;
  schema_version: number;
  message_id: string;
  conversation_id?: string;
  sequence?: number;
  actor: CanonicalMessageActor;
  occurred_at: string | null;
  content: CanonicalTextBlock[];
  source?: {
    system?: string;
    external_id?: string;
    [key: string]: unknown;
  };
  integrity?: {
    canonical_sha256?: string;
    [key: string]: unknown;
  };
}

export interface AssociatedMemoryFact {
  id: string;
  text: string;
  type?: "world" | "experience" | "observation" | string;
}

/**
 * Parses raw text into an array of `CanonicalMessage` objects if the text represents
 * a valid JSONL stream of canonical messages.
 *
 * Returns `null` if the text is empty or is not canonical message JSONL.
 */
export function parseCanonicalMessages(
  rawText: string | null | undefined
): CanonicalMessage[] | null {
  if (!rawText || !rawText.trim()) {
    return null;
  }

  const lines = rawText.split("\n");
  const messages: CanonicalMessage[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const record = JSON.parse(trimmed);
      if (
        !record ||
        typeof record !== "object" ||
        record.type !== CANONICAL_MESSAGE_TYPE ||
        typeof record.message_id !== "string" ||
        !record.message_id ||
        !record.actor ||
        typeof record.actor !== "object" ||
        !Array.isArray(record.content)
      ) {
        return null;
      }
      messages.push(record as CanonicalMessage);
    } catch {
      return null;
    }
  }

  return messages.length > 0 ? messages : null;
}

/**
 * Extracts plain text content from a CanonicalMessage's content blocks.
 */
export function getCanonicalMessageText(message: CanonicalMessage): string {
  if (!message.content || !Array.isArray(message.content)) {
    return "";
  }
  return message.content
    .map((block) => (typeof block?.text === "string" ? block.text : ""))
    .filter(Boolean)
    .join("\n");
}

/**
 * Safely extracts source message IDs from a memory unit's metadata.
 */
export function extractSourceMessageIds(
  metadata: Record<string, unknown> | null | undefined
): string[] {
  if (!metadata) return [];
  const raw = metadata[SOURCE_MESSAGE_IDS_METADATA];
  if (Array.isArray(raw)) {
    return raw.filter((id): id is string => typeof id === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Builds a mapping from canonical `message_id` to the memory units derived from it.
 */
export function buildEvidenceMapping(
  memoryUnits: Array<{
    id: string;
    text?: string;
    fact?: string;
    type?: string;
    fact_type?: string;
    metadata?: Record<string, unknown> | null;
  }>
): Map<string, AssociatedMemoryFact[]> {
  const map = new Map<string, AssociatedMemoryFact[]>();

  for (const unit of memoryUnits) {
    const ids = extractSourceMessageIds(unit.metadata);
    const factText = unit.text || unit.fact || "";
    const factType = unit.type || unit.fact_type || "world";

    for (const id of ids) {
      if (!map.has(id)) {
        map.set(id, []);
      }
      map.get(id)!.push({
        id: unit.id,
        text: factText,
        type: factType,
      });
    }
  }

  return map;
}
