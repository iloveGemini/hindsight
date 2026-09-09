import { describe, expect, it } from "vitest";
import {
  parseCanonicalMessages,
  getCanonicalMessageText,
  extractSourceMessageIds,
  buildEvidenceMapping,
  CANONICAL_MESSAGE_TYPE,
  CANONICAL_MESSAGE_SCHEMA_VERSION,
  SOURCE_MESSAGE_IDS_METADATA,
  SOURCE_MESSAGE_SCHEMA_METADATA,
} from "@/lib/canonical-message";

describe("canonical-message", () => {
  it("exports expected schema constants", () => {
    expect(CANONICAL_MESSAGE_SCHEMA_VERSION).toBe(1);
    expect(SOURCE_MESSAGE_SCHEMA_METADATA).toBe("hindsight_source_schema");
  });

  it("parses valid canonical message JSONL", () => {
    const raw = [
      JSON.stringify({
        type: CANONICAL_MESSAGE_TYPE,
        schema_version: 1,
        message_id: "msg-1",
        sequence: 1,
        actor: { role: "user" },
        occurred_at: "2026-09-08T10:00:00Z",
        content: [{ type: "text", text: "Hello there" }],
      }),
      JSON.stringify({
        type: CANONICAL_MESSAGE_TYPE,
        schema_version: 1,
        message_id: "msg-2",
        sequence: 2,
        actor: { role: "assistant" },
        occurred_at: "2026-09-08T10:00:05Z",
        content: [{ type: "text", text: "Hi! How can I help?" }],
      }),
    ].join("\n");

    const parsed = parseCanonicalMessages(raw);
    expect(parsed).toHaveLength(2);
    expect(parsed?.[0].message_id).toBe("msg-1");
    expect(parsed?.[0].actor.role).toBe("user");
    expect(getCanonicalMessageText(parsed![0])).toBe("Hello there");
    expect(parsed?.[1].message_id).toBe("msg-2");
    expect(parsed?.[1].actor.role).toBe("assistant");
    expect(getCanonicalMessageText(parsed![1])).toBe("Hi! How can I help?");
  });

  it("returns null for non-canonical text or ordinary markdown", () => {
    expect(parseCanonicalMessages("Just plain text")).toBeNull();
    expect(parseCanonicalMessages('{"some": "other_json"}')).toBeNull();
    expect(parseCanonicalMessages("")).toBeNull();
    expect(parseCanonicalMessages(null)).toBeNull();
  });

  it("extracts source message IDs from stringified or raw arrays", () => {
    expect(
      extractSourceMessageIds({
        [SOURCE_MESSAGE_IDS_METADATA]: '["msg-1", "msg-2"]',
      })
    ).toEqual(["msg-1", "msg-2"]);

    expect(
      extractSourceMessageIds({
        [SOURCE_MESSAGE_IDS_METADATA]: ["msg-3"],
      })
    ).toEqual(["msg-3"]);

    expect(extractSourceMessageIds({})).toEqual([]);
    expect(extractSourceMessageIds(null)).toEqual([]);
  });

  it("builds evidence mapping from memory units to message IDs", () => {
    const units = [
      {
        id: "mem-1",
        fact: "User prefers TypeScript",
        fact_type: "world",
        metadata: {
          [SOURCE_MESSAGE_IDS_METADATA]: '["msg-1"]',
        },
      },
      {
        id: "mem-2",
        fact: "Assistant recommended Zod",
        fact_type: "experience",
        metadata: {
          [SOURCE_MESSAGE_IDS_METADATA]: '["msg-2"]',
        },
      },
    ];

    const mapping = buildEvidenceMapping(units);
    expect(mapping.get("msg-1")).toEqual([
      {
        id: "mem-1",
        text: "User prefers TypeScript",
        type: "world",
      },
    ]);
    expect(mapping.get("msg-2")).toEqual([
      {
        id: "mem-2",
        text: "Assistant recommended Zod",
        type: "experience",
      },
    ]);
    expect(mapping.get("msg-3")).toBeUndefined();
  });
});
