import { createHash } from "node:crypto";
import { uuidV5 } from "./uuid";
import type { TransportTurn } from "./chat";

export const CANONICAL_MESSAGE_TYPE = "hindsight.canonical_message" as const;
export const CANONICAL_MESSAGE_SCHEMA_VERSION = 1 as const;

export interface CanonicalTextBlock {
  type: "text";
  text: string;
}

export interface CanonicalMessage {
  type: typeof CANONICAL_MESSAGE_TYPE;
  schema_version: typeof CANONICAL_MESSAGE_SCHEMA_VERSION;
  message_id: string;
  conversation_id: string;
  sequence: number;
  actor: { role: string };
  occurred_at: string | null;
  content: CanonicalTextBlock[];
  source: { system: "hindsight-coding-agents"; external_id: string };
  integrity: { canonical_sha256: string };
}

function messageId(conversationId: string, sequence: number, turn: TransportTurn): string {
  return uuidV5(`${conversationId}\n${sequence}\n${JSON.stringify(turn)}`);
}

export function toCanonicalMessage(
  conversationId: string,
  turn: TransportTurn,
  sequence: number
): CanonicalMessage {
  const body = {
    type: CANONICAL_MESSAGE_TYPE,
    schema_version: CANONICAL_MESSAGE_SCHEMA_VERSION,
    message_id: messageId(conversationId, sequence, turn),
    conversation_id: conversationId,
    sequence,
    actor: { role: turn.role },
    occurred_at: turn.timestamp ?? null,
    content: [{ type: "text" as const, text: turn.content }],
    source: { system: "hindsight-coding-agents" as const, external_id: conversationId },
  };
  return {
    ...body,
    integrity: {
      canonical_sha256: createHash("sha256").update(JSON.stringify(body)).digest("hex"),
    },
  };
}

export function renderCanonicalJsonl(
  conversationId: string,
  turns: readonly TransportTurn[],
  startSequence = 1
): string {
  return turns
    .map((turn, index) =>
      JSON.stringify(toCanonicalMessage(conversationId, turn, startSequence + index))
    )
    .join("\n");
}
