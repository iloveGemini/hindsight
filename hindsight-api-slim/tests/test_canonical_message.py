import json

from hindsight_api.engine.retain.canonical_message import (
    CANONICAL_MESSAGE_SCHEMA_VERSION,
    CANONICAL_MESSAGE_TYPE,
    SOURCE_MESSAGE_IDS_METADATA,
    SOURCE_MESSAGE_SCHEMA_METADATA,
    canonical_message_ids,
    metadata_for_chunk,
)
from hindsight_api.engine.retain.fact_storage import _metadata_for_survivor


def _line(message_id: str, sequence: int) -> str:
    return json.dumps(
        {
            "type": CANONICAL_MESSAGE_TYPE,
            "schema_version": CANONICAL_MESSAGE_SCHEMA_VERSION,
            "message_id": message_id,
            "sequence": sequence,
        }
    )


def test_canonical_jsonl_carries_all_message_ids_on_the_derived_fact():
    chunk = "\n".join([_line("msg-1", 1), _line("msg-2", 2)])

    assert canonical_message_ids(chunk) == ["msg-1", "msg-2"]
    metadata = metadata_for_chunk({"source": "chat"}, chunk)
    assert json.loads(metadata[SOURCE_MESSAGE_IDS_METADATA]) == ["msg-1", "msg-2"]
    assert metadata[SOURCE_MESSAGE_SCHEMA_METADATA] == "hindsight.canonical_message/v1"


def test_noncanonical_jsonl_is_unchanged():
    chunk = '{"role":"user","content":"hello"}'

    assert canonical_message_ids(chunk) == []
    assert metadata_for_chunk({"source": "chat"}, chunk) == {"source": "chat"}


def test_metadata_updates_preserve_canonical_evidence():
    existing = {
        "source": "old",
        SOURCE_MESSAGE_IDS_METADATA: '["msg-1"]',
        SOURCE_MESSAGE_SCHEMA_METADATA: "hindsight.canonical_message/v1",
    }

    assert _metadata_for_survivor(existing, {"source": "new"}) == {
        "source": "new",
        SOURCE_MESSAGE_IDS_METADATA: '["msg-1"]',
        SOURCE_MESSAGE_SCHEMA_METADATA: "hindsight.canonical_message/v1",
    }
