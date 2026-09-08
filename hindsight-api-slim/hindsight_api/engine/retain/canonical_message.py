"""Small helpers for Hindsight's canonical-message JSONL projection."""

from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

CANONICAL_MESSAGE_TYPE = "hindsight.canonical_message"
CANONICAL_MESSAGE_SCHEMA_VERSION = 1
SOURCE_MESSAGE_IDS_METADATA = "hindsight_source_message_ids"
SOURCE_MESSAGE_SCHEMA_METADATA = "hindsight_source_schema"


def canonical_message_ids(text: str) -> list[str]:
    """Return message IDs when ``text`` is a valid canonical-message JSONL chunk.

    Ordinary JSONL and prose deliberately return an empty list: canonical metadata is
    additive and must never change the existing retain behavior for other inputs.
    """
    ids: list[str] = []
    for line in text.splitlines():
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except (TypeError, ValueError, json.JSONDecodeError):
            return []
        if not isinstance(record, dict):
            return []
        if (
            record.get("type") != CANONICAL_MESSAGE_TYPE
            or record.get("schema_version") != CANONICAL_MESSAGE_SCHEMA_VERSION
        ):
            return []
        message_id = record.get("message_id")
        if not isinstance(message_id, str) or not message_id:
            return []
        ids.append(message_id)
    return ids


def metadata_for_chunk(metadata: Mapping[str, Any] | None, chunk_text: str) -> dict[str, Any]:
    """Carry the canonical messages covered by a derived chunk on each derived fact."""
    ids = canonical_message_ids(chunk_text)
    if not ids:
        return dict(metadata or {})
    result = dict(metadata or {})
    result[SOURCE_MESSAGE_IDS_METADATA] = json.dumps(ids, ensure_ascii=False, separators=(",", ":"))
    result[SOURCE_MESSAGE_SCHEMA_METADATA] = f"{CANONICAL_MESSAGE_TYPE}/v{CANONICAL_MESSAGE_SCHEMA_VERSION}"
    return result
