// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CanonicalMessageViewer } from "@/components/canonical-message-viewer";
import { CanonicalMessage, AssociatedMemoryFact } from "@/lib/canonical-message";

afterEach(cleanup);

// Mock next-intl hooks
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("CanonicalMessageViewer", () => {
  const sampleMessages: CanonicalMessage[] = [
    {
      type: "hindsight.canonical_message",
      schema_version: 1,
      message_id: "msg-user-1",
      sequence: 1,
      actor: { role: "user" },
      occurred_at: "2026-09-08T10:00:00Z",
      content: [{ type: "text", text: "We prefer Zod schemas." }],
    },
    {
      type: "hindsight.canonical_message",
      schema_version: 1,
      message_id: "msg-asst-1",
      sequence: 2,
      actor: { role: "assistant" },
      occurred_at: "2026-09-08T10:00:10Z",
      content: [{ type: "text", text: "Got it! Zod will be used." }],
    },
    {
      type: "hindsight.canonical_message",
      schema_version: 1,
      message_id: "msg-act-1",
      sequence: 3,
      actor: { role: "action" },
      occurred_at: "2026-09-08T10:00:15Z",
      content: [{ type: "text", text: "npm install zod" }],
    },
  ];

  it("renders messages with correct roles and text", () => {
    render(<CanonicalMessageViewer messages={sampleMessages} />);

    expect(screen.getByText("We prefer Zod schemas.")).toBeDefined();
    expect(screen.getByText("Got it! Zod will be used.")).toBeDefined();
    expect(screen.getByText("npm install zod")).toBeDefined();
    expect(screen.getByText("User")).toBeDefined();
    expect(screen.getByText("Assistant")).toBeDefined();
    expect(screen.getByText("Action")).toBeDefined();
  });

  it("renders evidence facts indicator when message has derived facts", () => {
    const evidenceMapping = new Map<string, AssociatedMemoryFact[]>();
    evidenceMapping.set("msg-user-1", [
      {
        id: "mem-1",
        text: "User prefers Zod",
        type: "world",
      },
    ]);

    render(
      <CanonicalMessageViewer
        messages={sampleMessages}
        evidenceMapping={evidenceMapping}
      />
    );

    expect(screen.getByText("1 条衍生事实")).toBeDefined();
    expect(screen.getByText("衍生了 1 条记忆事实")).toBeDefined();
  });
});
